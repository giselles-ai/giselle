"use server";

import {
	db,
	knowledgeContentOpenaiVectorStoreFileRepresentations,
	knowledgeContents,
	knowledges,
} from "@/drizzle";
import { eq } from "drizzle-orm";
import { revalidateTag, unstable_cache } from "next/cache";
import type { KnowledgeId } from "../types";

const getKnowledgeContentsTag = (knowledgeId: KnowledgeId) =>
	`${knowledgeId}.getKnowledgeContents`;

export const getKnowledgeContents = async (knowledgeId: KnowledgeId) => {
	const cached = unstable_cache(
		async () => {
			return await db
				.select({
					id: knowledgeContents.id,
					name: knowledgeContents.name,
					status:
						knowledgeContentOpenaiVectorStoreFileRepresentations.openaiVectorStoreFileStatus,
					knowledgeName: knowledges.name,
					knowledgeId: knowledges.id,
				})
				.from(knowledgeContents)
				.innerJoin(
					knowledges,
					eq(knowledges.dbId, knowledgeContents.knowledgeDbId),
				)
				.innerJoin(
					knowledgeContentOpenaiVectorStoreFileRepresentations,
					eq(
						knowledgeContentOpenaiVectorStoreFileRepresentations.knowledgeContentDbId,
						knowledgeContents.dbId,
					),
				)
				.where(eq(knowledges.id, knowledgeId));
		},
		[knowledgeId],
		{
			tags: [getKnowledgeContentsTag(knowledgeId)],
		},
	);
	return await cached();
};

export const revalidateGetKnowledgeContents = async (
	knowledgeId: KnowledgeId,
) => {
	revalidateTag(getKnowledgeContentsTag(knowledgeId));
};
