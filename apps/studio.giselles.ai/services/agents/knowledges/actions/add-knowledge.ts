"use server";

import {
	agents,
	db,
	knowledgeOpenaiVectorStoreRepresentations,
	knowledges,
} from "@/drizzle";
import { openai } from "@/lib/openai";
import { eq } from "drizzle-orm";
import type { AgentId } from "../../types";
import type { Knowledge } from "../types";
import { revalidateGetKnowledges } from "./get-knowledges";

type AddKnowledgeArgs = {
	agentId: AgentId;
	knowledge: Knowledge;
};
export const addKnowledge = async (args: AddKnowledgeArgs) => {
	const [agent] = await db
		.select({ dbId: agents.dbId })
		.from(agents)
		.where(eq(agents.id, args.agentId));
	await db.transaction(async (tx) => {
		const [knowledge] = await tx
			.insert(knowledges)
			.values({
				id: args.knowledge.id,
				name: args.knowledge.name,
				agentDbId: agent.dbId,
			})
			.returning({
				dbId: knowledges.dbId,
			});
		const openaiVectorStore = await openai.beta.vectorStores.create({
			name: args.knowledge.name,
		});
		await tx.insert(knowledgeOpenaiVectorStoreRepresentations).values({
			knowledgeDbId: knowledge.dbId,
			openaiVectorStoreId: openaiVectorStore.id,
			openaiVectorStoreStatus: openaiVectorStore.status,
		});
	});
	await revalidateGetKnowledges({ agentId: args.agentId });
};
