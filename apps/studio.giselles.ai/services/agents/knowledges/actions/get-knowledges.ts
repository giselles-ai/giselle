"use server";

import { agents, db, knowledges } from "@/drizzle";
import type { AgentId } from "@/services/agents";
import { eq } from "drizzle-orm";
import { revalidateTag, unstable_cache } from "next/cache";
import type { Knowledge } from "../types";
import { getKnowledgeContents } from "./get-knowledge-contents";

type GetKnowledgesArgs = {
	agentId: AgentId;
};
type TagParams = {
	agentId: AgentId;
};

const getKnowledgesTag = (params: TagParams) =>
	`${params.agentId}.getKnowledges`;
export const getKnowledges = async (args: GetKnowledgesArgs) => {
	const dbKnowledges = await getCachedKnowledges(args);
	const knowledgeWithContents = await Promise.all(
		dbKnowledges.map(async (knowledge) => ({
			...knowledge,
			contents: await getKnowledgeContents(knowledge.id),
		})),
	);
	return knowledgeWithContents.map(
		(knowledge) =>
			({
				id: knowledge.id,
				name: knowledge.name,
				contents: knowledge.contents.map((knowledgeContent) => ({
					id: knowledgeContent.id,
					name: knowledgeContent.name,
					status: knowledgeContent.status,
				})),
			}) satisfies Knowledge,
	);
};

export const revalidateGetKnowledges = async (params: TagParams) => {
	revalidateTag(getKnowledgesTag(params));
};

const getCachedKnowledges = async (args: GetKnowledgesArgs) => {
	const cachedKnowledges = unstable_cache(
		() =>
			db
				.select({
					id: knowledges.id,
					name: knowledges.name,
				})
				.from(knowledges)
				.innerJoin(agents, eq(agents.dbId, knowledges.agentDbId))
				.where(eq(agents.id, args.agentId)),
		[args.agentId],
		{
			tags: [getKnowledgesTag(args)],
		},
	);

	return cachedKnowledges();
};
