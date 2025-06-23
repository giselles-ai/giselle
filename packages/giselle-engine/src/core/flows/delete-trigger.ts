import type { FlowTriggerId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { deleteFlowTrigger } from "./utils";

export async function deleteTrigger(args: {
	context: GiselleEngineContext;
	flowTriggerId: FlowTriggerId;
}) {
	await deleteFlowTrigger({
		storage: args.context.storage,
		flowTriggerId: args.flowTriggerId,
	});
}
