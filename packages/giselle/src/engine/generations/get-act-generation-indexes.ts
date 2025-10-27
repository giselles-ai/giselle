import type { ActId } from "../../concepts/identifiers";
import { getAct } from "../acts";
import type { GiselleEngineContext } from "../types";
import { getActGenerationIndexes as internal_getActGenerationIndexes } from "./internal/get-act-generation-indexes";

export async function getActGenerationIndexes({
	actId,
	context,
}: {
	context: GiselleEngineContext;
	actId: ActId;
}) {
	const [act, generationIndexes] = await Promise.all([
		getAct({ actId, context }),
		internal_getActGenerationIndexes({
			actId,
			experimental_storage: context.storage,
		}),
	]);
	return { act, generationIndexes };
}
