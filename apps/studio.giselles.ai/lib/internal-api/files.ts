"use server";

import { FileId, WorkspaceId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { assertWorkspaceAccess } from "@/lib/assert-workspace-access";

/**
 * Hard limit to upload file since Vercel Serverless Functions have a 4.5MB body size limit.
 * @see internal-packages/workflow-designer-ui/src/editor/properties-panel/file-node-properties-panel/file-panel.tsx
 */
const MAX_UPLOAD_SIZE_BYTES = 1024 * 1024 * 4.5;

function formatFileSize(size: number): string {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let formattedSize = size;
	let i = 0;
	while (formattedSize >= 1024 && i < units.length - 1) {
		formattedSize /= 1024;
		i++;
	}
	return `${formattedSize} ${units[i]}`;
}

function getFileSizeExceededMessage(maxSizeBytes: number) {
	return `File size exceeds the limit. Please upload a file smaller than ${formatFileSize(maxSizeBytes)}.`;
}

export async function uploadFile(formData: FormData) {
	const file = formData.get("file");
	const workspaceIdRaw = formData.get("workspaceId");
	const fileIdRaw = formData.get("fileId");
	const fileNameRaw = formData.get("fileName");

	if (!(file instanceof File)) {
		throw new Error("uploadFile: missing file");
	}
	if (file.size > MAX_UPLOAD_SIZE_BYTES) {
		throw new Error(getFileSizeExceededMessage(MAX_UPLOAD_SIZE_BYTES));
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

	await assertWorkspaceAccess(workspaceId);
	await giselle.uploadFile(file, workspaceId, fileId, fileNameRaw);
}

export async function removeFile(input: {
	workspaceId: WorkspaceId;
	fileId: FileId;
}) {
	await assertWorkspaceAccess(input.workspaceId);
	await giselle.removeFile(input.workspaceId, input.fileId);
}

export async function copyFile(input: {
	workspaceId: WorkspaceId;
	sourceFileId: FileId;
	destinationFileId: FileId;
}) {
	await assertWorkspaceAccess(input.workspaceId);
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
	await assertWorkspaceAccess(input.workspaceId);
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
	await assertWorkspaceAccess(input.workspaceId);
	return await giselle.addWebPage(input);
}

// Note: Server Actions file serialization is handled by Next.js. If we hit
// runtime serialization issues, we can switch this API to accept `FormData`.
