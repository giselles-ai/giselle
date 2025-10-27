import type { FlowTriggerId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { deleteFlowTrigger } from "./utils";

export async function deleteTrigger(args: {
	context: GiselleEngineContext;
	flowTriggerId: FlowTriggerId;
	useExperimentalStorage?: boolean;
}) {
	await deleteFlowTrigger({
		deprecated_storage: args.context.deprecated_storage,
		flowTriggerId: args.flowTriggerId,
		storage: args.context.storage,
		useExperimentalStorage: args.useExperimentalStorage ?? false,
	});
}
