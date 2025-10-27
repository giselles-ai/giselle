import type { FileId, WorkspaceId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import type { GiselleStorage } from "../experimental_storage";
import { filePath } from "./utils";

export async function getFileText(args: {
	deprecated_storage: Storage;
	storage: GiselleStorage;
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
		const blob = await args.storage.getBlob(path);
		return Buffer.from(blob).toString();
	}
	const textLike = await args.deprecated_storage.getItem(path);
	if (typeof textLike !== "string") {
		return "";
	}
	return textLike;
}
