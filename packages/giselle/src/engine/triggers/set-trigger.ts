import type { FlowTrigger } from "@giselle-ai/protocol";
import type { GiselleEngineContext } from "../types";
import { setFlowTrigger as setFlowTriggerInternal } from "./utils";

export async function setTrigger(args: {
	context: GiselleEngineContext;
	trigger: FlowTrigger;
}) {
	await setFlowTriggerInternal({
		storage: args.context.storage,
		flowTrigger: args.trigger,
	});
}
