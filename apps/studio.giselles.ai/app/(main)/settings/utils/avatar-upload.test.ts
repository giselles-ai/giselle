import { describe, expect, it } from "vitest";
import { validateImageFileWithMagicBytes } from "./avatar-upload";

// Helper to create a File from bytes
function createFileFromBytes(
	bytes: number[],
	name: string,
	type: string,
): File {
	const uint8Array = new Uint8Array(bytes);
	const blob = new Blob([uint8Array], { type });
	return new File([blob], name, { type });
}

// Magic bytes for each format
const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46];
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const GIF_HEADER = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]; // GIF89a
const WEBP_HEADER = [
	0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
];

describe("validateImageFileWithMagicBytes", () => {
	describe("valid image files", () => {
		it("accepts valid JPEG file", async () => {
			const file = createFileFromBytes(JPEG_HEADER, "test.jpg", "image/jpeg");
			const result = await validateImageFileWithMagicBytes(file);

			expect(result.valid).toBe(true);
			if (result.valid) {
				expect(result.mimeType).toBe("image/jpeg");
				expect(result.ext).toBe("jpg");
			}
		});

		it("accepts valid PNG file", async () => {
			const file = createFileFromBytes(PNG_HEADER, "test.png", "image/png");
			const result = await validateImageFileWithMagicBytes(file);

			expect(result.valid).toBe(true);
			if (result.valid) {
				expect(result.mimeType).toBe("image/png");
				expect(result.ext).toBe("png");
			}
		});

		it("accepts valid GIF file", async () => {
			const file = createFileFromBytes(GIF_HEADER, "test.gif", "image/gif");
			const result = await validateImageFileWithMagicBytes(file);

			expect(result.valid).toBe(true);
			if (result.valid) {
				expect(result.mimeType).toBe("image/gif");
				expect(result.ext).toBe("gif");
			}
		});

		it("accepts valid WebP file", async () => {
			const file = createFileFromBytes(WEBP_HEADER, "test.webp", "image/webp");
			const result = await validateImageFileWithMagicBytes(file);

			expect(result.valid).toBe(true);
			if (result.valid) {
				expect(result.mimeType).toBe("image/webp");
				expect(result.ext).toBe("webp");
			}
		});
	});

	describe("invalid files", () => {
		it("rejects file with spoofed MIME type", async () => {
			const textBytes = [0x48, 0x65, 0x6c, 0x6c, 0x6f]; // "Hello"
			const file = createFileFromBytes(textBytes, "fake.jpg", "image/jpeg");
			const result = await validateImageFileWithMagicBytes(file);

			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error).toEqual(
					"Invalid file format. Please upload a JPG, PNG, GIF, or WebP image.",
				);
			}
		});
	});

	describe("file size validation", () => {
		it("rejects file exceeding 1MB limit", async () => {
			// Create a file larger than 1MB
			const largeBytes = new Array(1024 * 1024 + 1).fill(0xff);
			const file = createFileFromBytes(largeBytes, "large.jpg", "image/jpeg");
			const result = await validateImageFileWithMagicBytes(file);

			expect(result.valid).toBe(false);
			if (!result.valid) {
				expect(result.error).toContain("File size exceeds");
			}
		});
	});
});
