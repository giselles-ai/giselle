import { z } from "zod";
import { BaseNodeData } from "../types";
import { TextContent } from "./text";

const VariableNodeContentData = z.discriminatedUnion("type", [TextContent]);

export const VariableNodeData = BaseNodeData.extend({
	type: z.literal("variable"),
	content: VariableNodeContentData,
});
