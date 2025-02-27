import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod";
import { InputId, NodeReference, OutputId } from "./node";

export const ConnectionId = createIdGenerator("cnnc");
export type ConnectionId = z.infer<typeof ConnectionId.schema>;
export const Connection = z.object({
	id: ConnectionId.schema,
	outputNode: NodeReference,
	outputId: OutputId.schema,
	inputNode: NodeReference,
	inputId: InputId.schema,
});
export type Connection = z.infer<typeof Connection>;
