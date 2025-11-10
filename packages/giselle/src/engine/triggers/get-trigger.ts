import type { TriggerId } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../types";
import { getTrigger as systemGetTrigger } from "./utils";

export async function getTrigger(args: {
	context: GiselleEngineContext;
	triggerId: TriggerId;
}) {
	return await systemGetTrigger({
		triggerId: args.triggerId,
		storage: args.context.storage,
	});
}
