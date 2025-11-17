import type { ActId } from "@giselles-ai/protocol";
import { getAct } from "../acts";
import type { GiselleContext } from "../types";
import { getActGenerationIndexes as internal_getActGenerationIndexes } from "./internal/get-act-generation-indexes";

export async function getActGenerationIndexes({
	actId,
	context,
}: {
	context: GiselleContext;
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
