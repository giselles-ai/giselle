import type { ActId } from "@giselles-ai/protocol";
import { Act } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { actPath } from "./object/paths";

export async function getAct(args: { actId: ActId; context: GiselleContext }) {
	const act = await args.context.storage.getJson({
		path: actPath(args.actId),
		schema: Act,
	});
	return act;
}
