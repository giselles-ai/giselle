import { z } from "zod";
import { Node, OperationNode } from "../node";

export const GenerationTemplate = z.object({
	operationNode: OperationNode,
	sourceNodes: z.array(Node),
});
export type GenerationTemplate = z.infer<typeof GenerationTemplate>;
