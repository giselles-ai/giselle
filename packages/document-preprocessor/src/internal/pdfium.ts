import { init as initPdfium, type WrappedPdfiumModule } from "@embedpdf/pdfium";

import { assertNotAborted } from "./abort.js";

type PdfiumRenderCallback = (frame: {
	data: Uint8Array;
	width: number;
	height: number;
}) => Promise<Uint8Array> | Uint8Array;

type PdfiumRenderOptions =
	| {
			scale: number;
			renderFormFields?: boolean;
			render: PdfiumRenderCallback;
	  }
	| {
			width: number;
			height: number;
			renderFormFields?: boolean;
			render: PdfiumRenderCallback;
	  };

interface PdfiumPageRender {
	readonly width: number;
	readonly height: number;
	readonly data: Uint8Array;
}

interface PdfiumPage {
	readonly number: number;
	getSize(): { width: number; height: number };
	getText(): string;
	render(options: PdfiumRenderOptions): Promise<PdfiumPageRender>;
	close(): void;
}

interface PdfiumDocument {
	getPageCount(): number;
	loadPage(pageIndex: number): PdfiumPage;
}

type WithPdfDocumentOptions = {
	password?: string;
	signal?: AbortSignal;
};

const FORM_INFO_SIZE = 256;
const BYTES_PER_PIXEL = 4;
const FPDF_BITMAP_FORMAT_BGRA = 4;
const FPDF_RENDER_FLAG_REVERSE_BYTE_ORDER = 0x10;
const FPDF_RENDER_FLAG_ANNOT = 0x01;
const FPDF_RENDER_FLAG_LCD_TEXT = 0x02;

type PdfiumHeap = {
	HEAPU8: Uint8Array;
};

const PDFIUM_ERROR_MESSAGES: Record<number, string> = {
	1: "PDFium: unknown error", // UNKNOWN
	2: "PDFium: file not found or could not be opened", // FILE
	3: "PDFium: file is not a valid PDF or is corrupted", // FORMAT
	4: "PDFium: password required or incorrect password", // PASSWORD
	5: "PDFium: unsupported security scheme", // SECURITY
	6: "PDFium: page not found or content error", // PAGE
};

let cachedModule: WrappedPdfiumModule | null = null;
let pendingModule: Promise<WrappedPdfiumModule> | null = null;

async function getPdfiumModule(): Promise<WrappedPdfiumModule> {
	if (cachedModule !== null) {
		return cachedModule;
	}

	if (pendingModule === null) {
		pendingModule = initPdfium({})
			.then((module) => {
				module.FPDF_InitLibrary();
				module.PDFiumExt_Init();
				cachedModule = module;
				return module;
			})
			.finally(() => {
				pendingModule = null;
			});
	}

	return await pendingModule;
}

function getHeap(pdfium: WrappedPdfiumModule["pdfium"]): Uint8Array {
	return (pdfium as unknown as PdfiumHeap).HEAPU8;
}

export async function withPdfDocument<T>(
	data: Uint8Array,
	options: WithPdfDocumentOptions,
	handler: (document: PdfiumDocument) => Promise<T> | T,
): Promise<T> {
	assertNotAborted(options.signal);
	const module = await getPdfiumModule();
	assertNotAborted(options.signal);
	const document = loadDocument(module, data, options.password ?? "");
	try {
		assertNotAborted(options.signal);
		return await handler(document);
	} finally {
		document.close();
	}
}

class PdfiumDocumentImpl implements PdfiumDocument {
	private readonly module: WrappedPdfiumModule;
	private documentHandle: number;
	private readonly dataPtr: number;
	private formInfoPtr: number | null = null;
	private formHandle: number | null = null;
	private closed = false;

	constructor(
		module: WrappedPdfiumModule,
		documentHandle: number,
		dataPtr: number,
	) {
		this.module = module;
		this.documentHandle = documentHandle;
		this.dataPtr = dataPtr;
	}

	getPageCount(): number {
		this.ensureOpen();
		return this.module.FPDF_GetPageCount(this.documentHandle);
	}

	loadPage(pageIndex: number): PdfiumPage {
		this.ensureOpen();
		const pageHandle = this.module.FPDF_LoadPage(
			this.documentHandle,
			pageIndex,
		);
		if (pageHandle === 0) {
			throw new Error(`PDFium: failed to load page index ${pageIndex}`);
		}
		return new PdfiumPageImpl(this.module, this, pageHandle, pageIndex);
	}

	close(): void {
		if (this.closed) {
			return;
		}
		this.closed = true;

		if (this.formHandle !== null) {
			this.module.FPDFDOC_ExitFormFillEnvironment(this.formHandle);
			this.formHandle = null;
		}
		if (this.formInfoPtr !== null) {
			this.module.pdfium.wasmExports.free(this.formInfoPtr);
			this.formInfoPtr = null;
		}

		this.module.FPDF_CloseDocument(this.documentHandle);
		this.documentHandle = 0;
		this.module.pdfium.wasmExports.free(this.dataPtr);
	}

	ensureFormEnvironment(): number {
		this.ensureOpen();
		if (this.formHandle !== null) {
			return this.formHandle;
		}

		const formPtr = this.module.pdfium.wasmExports.malloc(FORM_INFO_SIZE);
		if (formPtr === 0) {
			throw new Error("PDFium: failed to allocate memory for form environment");
		}

		const heap = getHeap(this.module.pdfium);
		heap.fill(0, formPtr, formPtr + FORM_INFO_SIZE);
		new DataView(heap.buffer).setUint32(formPtr, 2, true);
		const formHandle = this.module.FPDFDOC_InitFormFillEnvironment(
			this.documentHandle,
			formPtr,
		);
		if (formHandle === 0) {
			this.module.pdfium.wasmExports.free(formPtr);
			throw new Error("PDFium: failed to initialize form environment");
		}

		this.formInfoPtr = formPtr;
		this.formHandle = formHandle;
		return formHandle;
	}

	closePage(pageHandle: number): void {
		if (pageHandle !== 0) {
			this.module.FPDF_ClosePage(pageHandle);
		}
	}

	private ensureOpen(): void {
		if (this.closed) {
			throw new Error("PDFium: document has been closed");
		}
	}
}

class PdfiumPageImpl implements PdfiumPage {
	private readonly module: WrappedPdfiumModule;
	private readonly document: PdfiumDocumentImpl;
	private pageHandle: number;
	readonly number: number;
	private closed = false;

	constructor(
		module: WrappedPdfiumModule,
		document: PdfiumDocumentImpl,
		pageHandle: number,
		pageIndex: number,
	) {
		this.module = module;
		this.document = document;
		this.pageHandle = pageHandle;
		this.number = pageIndex;
	}

	getSize(): { width: number; height: number } {
		this.ensureOpen();
		const width = this.module.FPDF_GetPageWidth(this.pageHandle);
		const height = this.module.FPDF_GetPageHeight(this.pageHandle);
		return {
			width,
			height,
		};
	}

	getText(): string {
		this.ensureOpen();
		const textPage = this.module.FPDFText_LoadPage(this.pageHandle);
		if (textPage === 0) {
			throw new Error("PDFium: failed to load text page");
		}

		try {
			const charCount = this.module.FPDFText_CountChars(textPage);
			if (charCount <= 0) {
				return "";
			}

			const bufferSize = (charCount + 1) * 2;
			const textPtr = this.module.pdfium.wasmExports.malloc(bufferSize);
			if (textPtr === 0) {
				throw new Error(
					"PDFium: failed to allocate buffer for text extraction",
				);
			}

			try {
				const length = this.module.FPDFText_GetText(
					textPage,
					0,
					charCount,
					textPtr,
				);
				if (length <= 0) {
					return "";
				}

				const heap = getHeap(this.module.pdfium);
				const bytes = heap.slice(textPtr, textPtr + (length - 1) * 2);
				return new TextDecoder("utf-16le").decode(bytes);
			} finally {
				this.module.pdfium.wasmExports.free(textPtr);
			}
		} finally {
			this.module.FPDFText_ClosePage(textPage);
		}
	}

	async render(options: PdfiumRenderOptions): Promise<PdfiumPageRender> {
		this.ensureOpen();
		const { width: baseWidth, height: baseHeight } = this.getSize();
		const { width, height } = calculateRenderSize(
			baseWidth,
			baseHeight,
			options,
		);

		const bufferSize = width * height * BYTES_PER_PIXEL;
		const bufferPtr = this.module.pdfium.wasmExports.malloc(bufferSize);
		if (bufferPtr === 0) {
			throw new Error("PDFium: failed to allocate bitmap buffer");
		}

		const heap = getHeap(this.module.pdfium);
		heap.fill(0, bufferPtr, bufferPtr + bufferSize);
		const stride = width * BYTES_PER_PIXEL;
		let bitmapHandle = 0;
		let formHandle: number | null = null;
		let formLoaded = false;

		try {
			bitmapHandle = this.module.FPDFBitmap_CreateEx(
				width,
				height,
				FPDF_BITMAP_FORMAT_BGRA,
				bufferPtr,
				stride,
			);
			if (bitmapHandle === 0) {
				throw new Error("PDFium: failed to create bitmap");
			}

			this.module.FPDFBitmap_FillRect(
				bitmapHandle,
				0,
				0,
				width,
				height,
				0xffffffff,
			);

			const shouldRenderForms = options.renderFormFields ?? true;
			if (shouldRenderForms) {
				formHandle = this.document.ensureFormEnvironment();
				this.module.FORM_OnAfterLoadPage(this.pageHandle, formHandle);
				formLoaded = true;
			}

			const renderFlags =
				FPDF_RENDER_FLAG_REVERSE_BYTE_ORDER |
				FPDF_RENDER_FLAG_ANNOT |
				FPDF_RENDER_FLAG_LCD_TEXT;
			this.module.FPDF_RenderPageBitmap(
				bitmapHandle,
				this.pageHandle,
				0,
				0,
				width,
				height,
				0,
				renderFlags,
			);

			if (formHandle !== null) {
				const formFlags = renderFlags & ~FPDF_RENDER_FLAG_ANNOT;
				this.module.FPDF_FFLDraw(
					formHandle,
					bitmapHandle,
					this.pageHandle,
					0,
					0,
					width,
					height,
					0,
					formFlags,
				);
			}

			const frame = heap.slice(bufferPtr, bufferPtr + bufferSize);
			const data = await options.render({ data: frame, width, height });

			return { width, height, data };
		} finally {
			if (formLoaded && formHandle !== null) {
				this.module.FORM_OnBeforeClosePage(this.pageHandle, formHandle);
			}
			if (bitmapHandle !== 0) {
				this.module.FPDFBitmap_Destroy(bitmapHandle);
			}
			this.module.pdfium.wasmExports.free(bufferPtr);
		}
	}

	close(): void {
		if (this.closed) {
			return;
		}
		this.closed = true;
		this.document.closePage(this.pageHandle);
		this.pageHandle = 0;
	}

	private ensureOpen(): void {
		if (this.closed) {
			throw new Error("PDFium: page has been closed");
		}
	}
}

function loadDocument(
	module: WrappedPdfiumModule,
	data: Uint8Array,
	password: string,
): PdfiumDocumentImpl {
	const dataPtr = module.pdfium.wasmExports.malloc(data.length);
	if (dataPtr === 0) {
		throw new Error("PDFium: failed to allocate memory for document");
	}

	const heap = getHeap(module.pdfium);
	heap.set(data, dataPtr);
	const documentHandle = module.FPDF_LoadMemDocument(
		dataPtr,
		data.length,
		password,
	);
	if (documentHandle === 0) {
		module.pdfium.wasmExports.free(dataPtr);
		const errorCode = module.FPDF_GetLastError();
		const message =
			PDFIUM_ERROR_MESSAGES[errorCode] ??
			`PDFium: failed to load document (error ${errorCode})`;
		throw new Error(message);
	}

	return new PdfiumDocumentImpl(module, documentHandle, dataPtr);
}

function calculateRenderSize(
	baseWidth: number,
	baseHeight: number,
	options: PdfiumRenderOptions,
): { width: number; height: number } {
	if ("width" in options && "height" in options) {
		return {
			width: Math.max(Math.floor(options.width), 1),
			height: Math.max(Math.floor(options.height), 1),
		};
	}

	const scale = "scale" in options ? options.scale : 1;
	const width = Math.max(Math.floor(baseWidth * scale), 1);
	const height = Math.max(Math.floor(baseHeight * scale), 1);
	return { width, height };
}
