import type { FlowTrigger } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { setFlowTrigger as setFlowTriggerInternal } from "./utils";

export async function setTrigger(args: {
	context: GiselleEngineContext;
	trigger: FlowTrigger;
	useExperimentalStorage?: boolean;
}) {
	await setFlowTriggerInternal({
		storage: args.context.deprecated_storage,
		experimental_storage: args.context.storage,
		flowTrigger: args.trigger,
		useExperimentalStorage: args.useExperimentalStorage ?? false,
	});
}
