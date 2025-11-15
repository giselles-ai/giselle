import type { ActId } from "@giselles-ai/protocol";
import { Act } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../contracts";
import { actPath } from "./object/paths";

export async function getAct(args: {
	actId: ActId;
	context: GiselleEngineContext;
}) {
	const act = await args.context.storage.getJson({
		path: actPath(args.actId),
		schema: Act,
	});
	return act;
}
