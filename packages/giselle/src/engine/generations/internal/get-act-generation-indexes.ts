import type { ActId } from "../../../concepts";
import { NodeGenerationIndex } from "../../../concepts";
import { actGenerationIndexesPath } from "../../../concepts/path";
import type { GiselleStorage } from "../../storage";

export async function getActGenerationIndexes(args: {
	actId: ActId;
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
