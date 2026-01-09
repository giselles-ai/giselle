"use server";

import type { FileId, WorkspaceId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";

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

// Note: uploadFile is intentionally not migrated yet because client-side calls
// currently pass a `File` object through JSON→FormData fetch. We'll migrate it
// when we decide the preferred Server Action form-data approach.
