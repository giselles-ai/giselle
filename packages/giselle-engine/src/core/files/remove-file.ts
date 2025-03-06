import type { FileId, WorkspaceId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { filePath } from "./utils";

export async function removeFile(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
	fileId: FileId;
	fileName: string;
}) {
	await args.context.storage.removeItem(
		filePath({
			type: "workspace",
			id: args.workspaceId,
			fileId: args.fileId,
			fileName: args.fileName,
		}),
	);
}
