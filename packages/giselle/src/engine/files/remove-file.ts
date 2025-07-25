import type { FileId, WorkspaceId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import type { GiselleStorage } from "../experimental_storage";
import { filePath } from "./utils";

export async function removeFile(args: {
	storage: Storage;
	experimental_storage: GiselleStorage;
	useExperimentalStorage: boolean;
	workspaceId: WorkspaceId;
	fileId: FileId;
}) {
	const path = filePath({
		type: "studio",
		workspaceId: args.workspaceId,
		fileId: args.fileId,
	});
	if (args.useExperimentalStorage) {
		await args.experimental_storage.remove(path);
	} else {
		await args.storage.removeItem(path);
	}
}
