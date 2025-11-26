import { ConnectionId, Input, NodeLike, Output } from "@giselles-ai/protocol";
import * as z from "zod/v4";

export const UIConnection = z.object({
	id: ConnectionId.schema,
	outputNode: NodeLike,
	output: Output,
	inputNode: NodeLike,
	input: Input,
});
export type UIConnection = z.infer<typeof UIConnection>;
