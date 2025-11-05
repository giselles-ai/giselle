import type { FlowTriggerId } from "@giselle-ai/protocol";
import type { GiselleEngineContext } from "../types";
import { deleteFlowTrigger } from "./utils";

export async function deleteTrigger(args: {
	context: GiselleEngineContext;
	flowTriggerId: FlowTriggerId;
}) {
	await deleteFlowTrigger({
		flowTriggerId: args.flowTriggerId,
		storage: args.context.storage,
	});
}
