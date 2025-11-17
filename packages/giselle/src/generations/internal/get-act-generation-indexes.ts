import type { TaskId } from "@giselles-ai/protocol";
import { NodeGenerationIndex } from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import { actGenerationIndexesPath } from "../../path";

export async function getActGenerationIndexes(args: {
	actId: TaskId;
	storage: GiselleStorage;
}) {
	if (!(await args.storage.exists(actGenerationIndexesPath(args.actId)))) {
		return undefined;
	}
	return await args.storage.getJson({
		path: actGenerationIndexesPath(args.actId),
		schema: NodeGenerationIndex.array(),
	});
}
