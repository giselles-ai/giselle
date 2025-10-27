import type { FileId, WorkspaceId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import type { GiselleStorage } from "../experimental_storage";
import { filePath } from "./utils";

export async function uploadFile(args: {
	deprecated_storage: Storage;
	storage: GiselleStorage;
	useExperimentalStorage: boolean;
	file: File;
	workspaceId: WorkspaceId;
	fileId: FileId;
	fileName: string;
}) {
	const fileBuffer = await fileToBuffer(args.file);
	const path = filePath({
		type: "studio",
		workspaceId: args.workspaceId,
		fileId: args.fileId,
	});
	if (args.useExperimentalStorage) {
		await args.storage.setBlob(path, fileBuffer);
	} else {
		await args.deprecated_storage.setItemRaw(path, fileBuffer);
	}
}

async function fileToBuffer(file: File) {
	const buffer = await file.arrayBuffer();
	return Buffer.from(buffer);
}
