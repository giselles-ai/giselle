import { extractText } from "@giselle-sdk/document-preprocessor";
import { resolveSupportedDocumentFile } from "../utils";

export interface ExtractTextOptions {
	signal?: AbortSignal;
}

export interface ExtractTextResult {
	text: string;
	fileType: "txt" | "md";
}

/**
 * Extract text content from TXT or Markdown files
 * @param buffer - File content buffer
 * @param fileName - Original file name for type detection
 * @param options - Optional extraction settings
 * @returns Extracted text and file type
 * @throws Error if file type is unsupported
 */
export function extractTextFromDocument(
	buffer: Buffer,
	fileName: string,
	options?: ExtractTextOptions,
): ExtractTextResult {
	const { signal } = options ?? {};

	signal?.throwIfAborted();

	const fileTypeInfo = resolveSupportedDocumentFile({ name: fileName });

	if (!fileTypeInfo) {
		throw new Error(`Unsupported file type: ${fileName}`);
	}

	if (fileTypeInfo.extension === ".pdf") {
		throw new Error("PDF extraction is not supported in this function");
	}

	const { text } = extractText(buffer);

	const fileType = fileTypeInfo.extension === ".md" ? "md" : "txt";

	return { text, fileType };
}
