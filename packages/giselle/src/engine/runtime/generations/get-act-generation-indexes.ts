import type { ActId } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../../contracts";
import { getAct } from "../acts";
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
			storage: context.storage,
		}),
	]);
	return { act, generationIndexes };
}
