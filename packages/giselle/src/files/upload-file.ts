import type {
	FileId,
	UploadedFileData,
	WorkspaceId,
} from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import { filePath } from "./utils";

export async function uploadFile(args: {
	storage: GiselleStorage;
	file: File;
	workspaceId: WorkspaceId;
	fileId: FileId;
	fileName: string;
}) {
	const fileBuffer = await fileToBuffer(args.file);
	const blobPath = filePath({
		type: "studio",
		workspaceId: args.workspaceId,
		fileId: args.fileId,
	});
	await args.storage.setBlob(blobPath, fileBuffer);

	const metadataPath = `${blobPath.slice(0, blobPath.lastIndexOf("/"))}/metadata.json`;
	const metadata: UploadedFileData = {
		id: args.fileId,
		name: args.fileName,
		type: args.file.type,
		size: args.file.size,
		status: "uploaded",
		uploadedAt: Date.now(),
	};
	await args.storage.setBlob(
		metadataPath,
		Buffer.from(JSON.stringify(metadata)),
	);
}

async function fileToBuffer(file: File) {
	const buffer = await file.arrayBuffer();
	return Buffer.from(buffer);
}
