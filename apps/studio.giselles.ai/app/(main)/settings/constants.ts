export const IMAGE_CONSTRAINTS = {
	maxSize: 4 * 1024 * 1024, // 4MB
	formats: ["image/jpeg", "image/png", "image/gif", "image/webp"],
	mimeToExt: {
		"image/jpeg": "jpg",
		"image/png": "png",
		"image/gif": "gif",
		"image/webp": "webp",
	},
};
