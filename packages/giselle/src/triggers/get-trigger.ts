import type { TriggerId } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { getTrigger as systemGetTrigger } from "./utils";

export async function getTrigger(args: {
	context: GiselleContext;
	triggerId: TriggerId;
}) {
	return await systemGetTrigger({
		triggerId: args.triggerId,
		storage: args.context.storage,
	});
}
