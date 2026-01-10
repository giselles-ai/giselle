"use server";

import { FileId, WorkspaceId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";

export async function uploadFile(formData: FormData) {
	const file = formData.get("file");
	const workspaceIdRaw = formData.get("workspaceId");
	const fileIdRaw = formData.get("fileId");
	const fileNameRaw = formData.get("fileName");

	if (!(file instanceof File)) {
		throw new Error("uploadFile: missing file");
	}
	if (typeof workspaceIdRaw !== "string") {
		throw new Error("uploadFile: missing workspaceId");
	}
	if (typeof fileIdRaw !== "string") {
		throw new Error("uploadFile: missing fileId");
	}
	if (typeof fileNameRaw !== "string") {
		throw new Error("uploadFile: missing fileName");
	}

	const workspaceId = WorkspaceId.parse(workspaceIdRaw);
	const fileId = FileId.parse(fileIdRaw);

	await giselle.uploadFile(file, workspaceId, fileId, fileNameRaw);
}

export async function removeFile(input: {
	workspaceId: WorkspaceId;
	fileId: FileId;
}) {
	await giselle.removeFile(input.workspaceId, input.fileId);
}

export async function copyFile(input: {
	workspaceId: WorkspaceId;
	sourceFileId: FileId;
	destinationFileId: FileId;
}) {
	await giselle.copyFile(
		input.workspaceId,
		input.sourceFileId,
		input.destinationFileId,
	);
}

export async function getFileText(input: {
	workspaceId: WorkspaceId;
	fileId: FileId;
}) {
	return {
		text: await giselle.getFileText({
			workspaceId: input.workspaceId,
			fileId: input.fileId,
		}),
	};
}

export async function addWebPage(
	input: Parameters<typeof giselle.addWebPage>[0],
) {
	return await giselle.addWebPage(input);
}

// Note: Server Actions file serialization is handled by Next.js. If we hit
// runtime serialization issues, we can switch this API to accept `FormData`.
