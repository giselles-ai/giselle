export type BlobLike = Buffer | Uint8Array | ArrayBuffer;
/**
 * Converts any BlobLike data to a Uint8Array.
 * This helper function handles the conversion logic for different binary data types.
 *
 * @param data - The binary data to convert
 * @returns A new Uint8Array containing the binary data
 *
 * @example
 * ```typescript
 * const buffer = Buffer.from("Hello");
 * const uint8Array = blobLikeToUint8Array(buffer);
 * console.log(uint8Array); // Uint8Array(5) [72, 101, 108, 108, 111]
 * ```
 */
export function blobLikeToUint8Array(data: BlobLike) {
	if (data instanceof Uint8Array) {
		return new Uint8Array(data);
	}
	if (data instanceof ArrayBuffer) {
		return new Uint8Array(data);
	}
	// Fallback should not happen with proper typing
	throw new Error("Invalid BlobLike data type");
}
