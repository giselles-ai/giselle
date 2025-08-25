import { createHash } from "node:crypto";
import { publicStorage } from "@/app/giselle-engine";
import { IMAGE_CONSTRAINTS } from "../constants";

async function calculateFileHash(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);
	const hash = createHash("sha256").update(buffer).digest("hex");
	// Return first 8 characters of hash for shorter filenames
	return hash.substring(0, 8);
}

function getExtensionFromMimeType(mimeType: string): string {
	return (
		IMAGE_CONSTRAINTS.mimeToExt[
			mimeType as keyof typeof IMAGE_CONSTRAINTS.mimeToExt
		] || "jpg"
	);
}

/**
 * Validate image file MIME type and size
 */
export function validateImageFile(file: File): {
	valid: boolean;
	error?: string;
} {
	if (!IMAGE_CONSTRAINTS.formats.includes(file.type)) {
		return {
			valid: false,
			error:
				"Invalid file format. Please upload a JPG, PNG, GIF, or WebP image.",
		};
	}
	if (file.size > IMAGE_CONSTRAINTS.maxSize) {
		return {
			valid: false,
			error: `File size exceeds ${IMAGE_CONSTRAINTS.maxSize / (1024 * 1024)}MB limit`,
		};
	}

	return {
		valid: true,
	};
}

async function generateAvatarPath(
	file: File,
	prefix: string,
	id: string,
): Promise<string> {
	const ext = getExtensionFromMimeType(file.type);
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
): Promise<string> {
	const filePath = await generateAvatarPath(file, prefix, id);
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	await publicStorage.setItemRaw(filePath, buffer, {
		contentType: file.type,
	});

	const avatarUrl = await publicStorage.getItem(filePath, {
		publicURL: true,
	});

	if (typeof avatarUrl !== "string") {
		throw new Error("Failed to get avatar URL");
	}

	return avatarUrl;
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
	await publicStorage.removeItem(path);
}
