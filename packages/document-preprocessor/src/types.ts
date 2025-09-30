import type { Buffer } from "node:buffer";

export type BinaryDataInput =
	| ArrayBuffer
	| ArrayBufferView
	| Uint8Array
	| Buffer;

export interface PdfTextPage {
	pageNumber: number;
	text: string;
}

export interface PdfTextExtractionOptions {
	password?: string;
	maxPages?: number;
	signal?: AbortSignal;
}

export interface PdfTextExtractionResult {
	totalPages: number;
	pages: PdfTextPage[];
}

export interface PdfImagePage {
	pageNumber: number;
	width: number;
	height: number;
	png: Uint8Array;
}

export interface PdfImageRenderOptions {
	password?: string;
	targetDpi?: number;
	maxPages?: number;
	signal?: AbortSignal;
	renderFormFields?: boolean;
}

export interface PdfImageRenderResult {
	totalPages: number;
	pages: PdfImagePage[];
}

export interface TextExtractionOptions {
	encoding?: BufferEncoding;
	signal?: AbortSignal;
}

export interface TextExtractionResult {
	text: string;
}
