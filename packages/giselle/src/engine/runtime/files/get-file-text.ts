import type { FileId, WorkspaceId } from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import { filePath } from "./utils";

export async function getFileText(args: {
	storage: GiselleStorage;
	workspaceId: WorkspaceId;
	fileId: FileId;
}) {
	const path = filePath({
		type: "studio",
		workspaceId: args.workspaceId,
		fileId: args.fileId,
	});
	const blob = await args.storage.getBlob(path);
	return Buffer.from(blob).toString();
}
