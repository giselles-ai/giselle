import { knowledgeIdSchema } from "@/services/agents/knowledges";
import { array, number, object, string } from "valibot";

export const dataSchema = object({
	openaiAssistantId: string(),
	knowledgeIds: array(knowledgeIdSchema),
});
