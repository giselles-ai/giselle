import type { FileId, WorkspaceId } from "@giselle-sdk/data-type";
import type { GiselleStorage } from "../experimental_storage";
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
