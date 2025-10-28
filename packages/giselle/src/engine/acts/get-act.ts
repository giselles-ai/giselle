import { Act } from "../../concepts/act";
import type { ActId } from "../../concepts/identifiers";
import type { GiselleEngineContext } from "../types";
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
