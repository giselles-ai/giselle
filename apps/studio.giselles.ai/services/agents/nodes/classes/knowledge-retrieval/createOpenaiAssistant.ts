"use server";

import {
	db,
	knowledgeOpenaiVectorStoreRepresentations,
	knowledges,
	nodes,
} from "@/drizzle";
import { openai } from "@/lib/openai";
import type { KnowledgeId } from "@/services/agents/knowledges";
import { eq, inArray } from "drizzle-orm";
import { parse } from "valibot";
import type { NodeGraph } from "../../types";
import { dataSchema } from "./data-schema";
import { retrivalInstructions } from "./prompts";

type CreateOpenaiAssistantArgs = {
	knowledgeIds: KnowledgeId[];
	nodeDbId: number;
	nodeGraph: NodeGraph;
};
/** @todo Make this implementation durable  */
export const createOpenaiAssistant = async (
	args: CreateOpenaiAssistantArgs,
) => {
	const knowledgeAsOpenaiVectorStores = await db
		.select({
			id: knowledgeOpenaiVectorStoreRepresentations.openaiVectorStoreId,
		})
		.from(knowledges)
		.innerJoin(
			knowledgeOpenaiVectorStoreRepresentations,
			inArray(knowledges.id, args.knowledgeIds),
		);
	const assistant = await openai.beta.assistants.create({
		model: "gpt-4o-mini",
		instructions: retrivalInstructions,
		tools: [{ type: "file_search" }],
		tool_resources: {
			file_search: {
				vector_store_ids: knowledgeAsOpenaiVectorStores.map(({ id }) => id),
			},
		},
	});
	const data = parse(dataSchema, {
		openaiAssistantId: assistant.id,
		knowledgeIds: args.knowledgeIds,
	});
	await db
		.update(nodes)
		.set({
			data,
			graph: {
				...args.nodeGraph,
				data,
			},
		})
		.where(eq(nodes.dbId, args.nodeDbId));
};
