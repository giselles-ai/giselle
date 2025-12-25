import { createHash } from "node:crypto";
import { appStorage } from "@/lib/app-storage";
import { logger } from "@/lib/logger";
import { IMAGE_CONSTRAINTS } from "../constants";

async function calculateFileHash(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const hash = createHash("sha256").update(buffer).digest("hex");
	// Return first 8 characters of hash for shorter filenames
	return hash.substring(0, 8);
}

/**
 * Detects image MIME type by examining its header bytes (magic bytes)
 */
function detectImageType(
	bytes: Uint8Array,
): { contentType: string; ext: string } | null {
	// Need at least 12 bytes to detect all supported formats (WebP requires bytes[8-11])
	if (bytes.length < 12) {
		return null;
	}

	// JPEG: Starts with FF D8 FF
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
		return { contentType: "image/jpeg", ext: "jpg" };
	}

	// PNG: Starts with 89 50 4E 47 0D 0A 1A 0A
	if (
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	) {
		return { contentType: "image/png", ext: "png" };
	}

	// GIF: Starts with 47 49 46 38 (GIF87a or GIF89a)
	if (
		bytes[0] === 0x47 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x38
	) {
		return { contentType: "image/gif", ext: "gif" };
	}

	// WebP: Starts with RIFF....WEBP (52 49 46 46 ... 57 45 42 50)
	if (
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return { contentType: "image/webp", ext: "webp" };
	}

	return null;
}

/**
 * Validate image file by checking magic bytes (actual file content)
 */
export async function validateImageFileWithMagicBytes(
	file: File,
): Promise<
	| { valid: true; mimeType: string; ext: string }
	| { valid: false; error: string }
> {
	// Check file size first (fast check)
	if (file.size >= IMAGE_CONSTRAINTS.maxSize) {
		return {
			valid: false,
			error: `File size exceeds ${IMAGE_CONSTRAINTS.maxSize / (1024 * 1024)}MB limit`,
		};
	}

	// Read file buffer for magic byte detection
	const arrayBuffer = await file.arrayBuffer();
	const buffer = new Uint8Array(arrayBuffer);
	const imageType = detectImageType(buffer);

	if (!imageType) {
		return {
			valid: false,
			error:
				"Invalid file format. Please upload a JPG, PNG, GIF, or WebP image.",
		};
	}

	return { valid: true, mimeType: imageType.contentType, ext: imageType.ext };
}

async function generateAvatarPath(
	file: File,
	prefix: string,
	id: string,
	ext: string,
): Promise<string> {
	const hash = await calculateFileHash(file);
	return `${prefix}/${id}-${hash}.${ext}`;
}

/**
 * Upload avatar to Supabase Storage
 */
export async function uploadAvatar(
	file: File,
	prefix: string,
	id: string,
	verifiedMimeType: string,
	ext: string,
): Promise<string> {
	const filePath = await generateAvatarPath(file, prefix, id, ext);
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	logger.debug(`Uploading avatar to ${filePath}`);
	const uploadResult = await appStorage().upload(filePath, buffer, {
		contentType: verifiedMimeType,
		upsert: true,
	});

	if (uploadResult.error) {
		logger.error(uploadResult.error);
		throw new Error("Failed to get avatar URL");
	}

	return appStorage().getPublicUrl(uploadResult.data.path).data.publicUrl;
}

/**
 * Delete avatar file from storage
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
	// Extract file path from URL
	// From: https://xxx.supabase.co/storage/v1/object/public/public-assets/avatars/user-id.jpg
	// To: avatars/user-id.jpg
	const parts = avatarUrl.split("/public-assets/");

	if (parts.length !== 2 || !parts[1]) {
		throw new Error(`Invalid avatar URL format: ${avatarUrl}`);
	}

	const path = parts[1];

	await appStorage().remove([path]);
}
