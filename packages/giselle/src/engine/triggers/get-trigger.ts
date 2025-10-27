import type { FlowTriggerId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { getFlowTrigger } from "./utils";

export async function getTrigger(args: {
	context: GiselleEngineContext;
	flowTriggerId: FlowTriggerId;
	useExperimentalStorage?: boolean;
}) {
	const flowTrigger = await getFlowTrigger({
		deprecated_storage: args.context.deprecated_storage,
		flowTriggerId: args.flowTriggerId,
		storage: args.context.storage,
		useExperimentalStorage: args.useExperimentalStorage ?? false,
	});
	return flowTrigger;
}
