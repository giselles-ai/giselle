import { createIdGenerator } from "@giselles-ai/utils";
import { z } from "zod/v4";

export const FileId = createIdGenerator("fl");
export type FileId = z.infer<typeof FileId.schema>;
export const FileDataBase = z.object({
	id: FileId.schema,
	name: z.string(),
	type: z.string(),
	size: z.number(),
	status: z.string(),
});

export const UploadingFileData = FileDataBase.extend({
	status: z.literal("uploading"),
});
export type UploadingFileData = z.infer<typeof UploadingFileData>;
export function createUploadingFileData(params: {
	name: string;
	type: string;
	size: number;
}): UploadingFileData {
	return {
		...params,
		id: FileId.generate(),
		status: "uploading",
	};
}

export const UploadedFileProviderOptionOpenAI = z.object({
	fileId: z.string(),
});
export const UploadedFileProviderOptions = z.object({
	openai: z.optional(UploadedFileProviderOptionOpenAI),
});

export const UploadedFileData = FileDataBase.extend({
	status: z.literal("uploaded"),
	uploadedAt: z.number(),
	providerOptions: z.optional(UploadedFileProviderOptions),
	originalFileIdForCopy: z.optional(FileId.schema),
});
export type UploadedFileData = z.infer<typeof UploadedFileData>;
export function createUploadedFileData(
	uploadingFile: UploadingFileData,
	uploadedAt: number,
): UploadedFileData {
	return {
		...uploadingFile,
		status: "uploaded",
		uploadedAt,
	};
}

export const FailedFileData = FileDataBase.extend({
	status: z.literal("failed"),
	errorMessage: z.string(),
	originalFileIdForCopy: z.optional(FileId.schema),
});
export type FailedFileData = z.infer<typeof FailedFileData>;

export function createFailedFileData(
	uploadingFile: UploadingFileData,
	errorMessage: string,
): FailedFileData {
	return {
		...uploadingFile,
		status: "failed",
		errorMessage,
	};
}

export const FileData = z.union([
	UploadingFileData,
	UploadedFileData,
	FailedFileData,
]);
export type FileData = z.infer<typeof FileData>;

export const FileCategory = z.enum(["pdf", "text", "image"]);
export type FileCategory = z.infer<typeof FileCategory>;
export const FileContent = z.object({
	type: z.literal("file"),
	category: FileCategory,
	files: z.array(FileData),
});
export type FileContent = z.infer<typeof FileContent>;

export const FileContentReference = z.object({
	type: FileContent.shape.type,
});
export type FileContentReference = z.infer<typeof FileContentReference>;
