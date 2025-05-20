import { z } from "zod";
import { Connection } from "../connection";
import { Node, OperationNode } from "../node";

export const GenerationTemplate = z.object({
	operationNode: OperationNode,
	sourceNodes: z.array(Node),
	connections: z.array(Connection).default([]),
});
export type GenerationTemplate = z.infer<typeof GenerationTemplate>;
