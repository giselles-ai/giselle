import { z } from "zod";
import { BaseNodeData } from "../types";
import { TextGenerationContent } from "./text-generation";

const ActionNodeContentData = z.discriminatedUnion("type", [
	TextGenerationContent,
]);

export const ActionNodeData = BaseNodeData.extend({
	type: z.literal("action"),
	content: ActionNodeContentData,
});
