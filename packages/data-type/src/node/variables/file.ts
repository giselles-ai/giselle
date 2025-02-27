import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod";
import { NodeBase, NodeId } from "../base";

export const FileId = createIdGenerator("fl");
export type FileId = z.infer<typeof FileId.schema>;
export const FileDataBase = z.object({
	id: FileId.schema,
	name: z.string(),
	contentType: z.string(),
	size: z.number(),
	status: z.string(),
});

export const UploadingFileData = FileDataBase.extend({
	status: z.literal("uploading"),
});
export type UploadingFileData = z.infer<typeof UploadingFileData>;
export function createUploadingFileData(params: {
	name: string;
	contentType: string;
	size: number;
}): UploadingFileData {
	return {
		id: FileId.generate(),
		name: params.name,
		contentType: params.contentType,
		size: params.size,
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
	title: z.string(),
	uploadedAt: z.number(),
	providerOptions: z.optional(UploadedFileProviderOptions),
});
export type UploadedFileData = z.infer<typeof UploadedFileData>;
export function createUploadedFileData(
	uploadingFile: UploadingFileData,
	uploadedAt: number,
	title: string,
): UploadedFileData {
	return {
		...uploadingFile,
		status: "uploaded",
		uploadedAt,
		title,
	};
}

export const FailedFileData = FileDataBase.extend({
	status: z.literal("failed"),
});

export const FileData = z.union([
	UploadingFileData,
	UploadedFileData,
	FailedFileData,
]);
export type FileData = z.infer<typeof FileData>;

export const FileCategory = z.enum(["pdf", "text"]);
export type FileCategory = z.infer<typeof FileCategory>;
export const FileContent = z.object({
	type: z.literal("file"),
	category: FileCategory,
	files: z.array(FileData),
});
export type FileContent = z.infer<typeof FileContent>;

export const FileNode = NodeBase.extend({
	type: z.literal("variable"),
	content: FileContent,
});
export type FileNode = z.infer<typeof FileNode>;

export function isFileNode(args: unknown): args is FileNode {
	const result = FileNode.safeParse(args);
	return result.success;
}

export const FileContentReference = z.object({
	type: FileContent.shape.type,
});
export type FileContentReference = z.infer<typeof FileContentReference>;
