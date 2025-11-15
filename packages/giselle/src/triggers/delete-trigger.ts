import type { TriggerId } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { deleteTrigger as systemDeleteTrigger } from "./utils";

export async function deleteTrigger(args: {
	context: GiselleContext;
	triggerId: TriggerId;
}) {
	await systemDeleteTrigger({
		triggerId: args.triggerId,
		storage: args.context.storage,
	});
}
