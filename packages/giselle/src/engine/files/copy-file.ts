import type { FileId, WorkspaceId } from "@giselle-ai/data-type";
import type { GiselleStorage } from "../storage";
import { filePath } from "./utils";

/**
 * Copies a file within the storage using getItemRaw and setItemRaw.
 * @param args - The arguments for copying the file.
 * @param args.workspaceId - The ID of the workspace where the file resides.
 * @param args.sourceFileId - The ID of the source file.
 * @param args.destinationFileId - The ID of the destination file.
 * @returns A promise that resolves when the file is copied.
 * @throws Error if reading the source file or writing the destination file fails.
 */
export async function copyFile(args: {
	storage: GiselleStorage;
	workspaceId: WorkspaceId;
	sourceFileId: FileId;
	destinationFileId: FileId;
}) {
	const { storage, workspaceId, sourceFileId, destinationFileId } = args;

	const sourcePath = filePath({
		type: "studio",
		workspaceId: workspaceId,
		fileId: sourceFileId,
	});
	const destinationPath = filePath({
		type: "studio",
		workspaceId: workspaceId,
		fileId: destinationFileId,
	});

	try {
		await storage.copy(sourcePath, destinationPath);
		return;
	} catch (error) {
		console.error(
			`Failed to copy file from ${sourcePath} to ${destinationPath}:`,
			error,
		);
		if (error instanceof Error) {
			throw new Error(
				`File copy failed: ${error.message} (Source: ${sourcePath}, Destination: ${destinationPath})`,
			);
		}
		throw new Error(
			`An unknown error occurred during file copy (Source: ${sourcePath}, Destination: ${destinationPath})`,
		);
	}
}
