import type { Trigger } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../contracts";
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
