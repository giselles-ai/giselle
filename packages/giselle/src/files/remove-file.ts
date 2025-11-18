import type { FileId, WorkspaceId } from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import { filePath } from "./utils";

export async function removeFile(args: {
	storage: GiselleStorage;
	workspaceId: WorkspaceId;
	fileId: FileId;
}) {
	const path = filePath({
		type: "studio",
		workspaceId: args.workspaceId,
		fileId: args.fileId,
	});
	await args.storage.remove(path);
}
