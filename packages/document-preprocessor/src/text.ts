import type {
	BinaryDataInput,
	TextExtractionOptions,
	TextExtractionResult,
} from "./types.js";

/**
 * Extract text from plain text or markdown files
 * @param input - Binary data input (Buffer, Uint8Array, etc.)
 * @param options - Optional extraction settings
 * @returns Extracted text content
 */
export function extractText(
	input: BinaryDataInput,
	options?: TextExtractionOptions,
): TextExtractionResult {
	const { encoding = "utf-8", signal } = options ?? {};

	signal?.throwIfAborted();

	// Convert to Buffer for text decoding
	let buffer: Buffer;
	if (Buffer.isBuffer(input)) {
		buffer = input;
	} else if (input instanceof Uint8Array) {
		buffer = Buffer.from(input);
	} else if (ArrayBuffer.isView(input)) {
		buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
	} else {
		buffer = Buffer.from(input);
	}

	const text = buffer.toString(encoding);

	return { text };
}
