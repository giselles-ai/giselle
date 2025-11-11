import type { Trigger } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../types";
import { setTrigger as setTriggerInternal } from "./utils";

export async function setTrigger(args: {
	context: GiselleEngineContext;
	trigger: Trigger;
}) {
	await setTriggerInternal({
		storage: args.context.storage,
		trigger: args.trigger,
	});
}
