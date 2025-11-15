import type { TriggerId } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../contracts";
import { deleteTrigger as systemDeleteTrigger } from "./utils";

export async function deleteTrigger(args: {
	context: GiselleEngineContext;
	triggerId: TriggerId;
}) {
	await systemDeleteTrigger({
		triggerId: args.triggerId,
		storage: args.context.storage,
	});
}
