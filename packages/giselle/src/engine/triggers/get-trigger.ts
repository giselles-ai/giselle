import type { FlowTriggerId } from "@giselle-ai/protocol";
import type { GiselleEngineContext } from "../types";
import { getFlowTrigger } from "./utils";

export async function getTrigger(args: {
	context: GiselleEngineContext;
	flowTriggerId: FlowTriggerId;
}) {
	const flowTrigger = await getFlowTrigger({
		flowTriggerId: args.flowTriggerId,
		storage: args.context.storage,
	});
	return flowTrigger;
}
