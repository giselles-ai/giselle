// "use server";

// import {
// 	agents,
// 	db,
// 	knowledgeContentOpenaiVectorStoreFileRepresentations,
// 	knowledgeContents,
// 	knowledges,
// } from "@/drizzle";
// import { eq, inArray } from "drizzle-orm";
// import type { AgentId } from "../../types";
// import {
// 	type Knowledge,
// 	type KnowledgeId,
// 	knowledgeContentStatus,
// } from "../types";

// export const getKnowledges = async (agentId: AgentId) => {
// 	const raw = await db
// 		.select({
// 			knowledgeId: knowledges.id,
// 			knowledgeName: knowledges.name,
// 			knowledgeContentId: knowledgeContents.id,
// 			knowledgeContentName: knowledgeContents.name,
// 			knowledgeContentType: knowledgeContents.type,
// 			knowledgeContentOpenaiStatus:
// 				knowledgeContentOpenaiVectorStoreFileRepresentations.openaiVectorStoreFileStatus,
// 		})
// 		.from(knowledgeContents)
// 		.innerJoin(
// 			knowledgeContentOpenaiVectorStoreFileRepresentations,
// 			eq(
// 				knowledgeContentOpenaiVectorStoreFileRepresentations.knowledgeContentDbId,
// 				knowledgeContents.dbId,
// 			),
// 		)
// 		.innerJoin(knowledges, eq(knowledges.dbId, knowledgeContents.knowledgeDbId))
// 		.innerJoin(agents, eq(knowledges.agentDbId, agents.dbId))
// 		.where(eq(agents.id, agentId));

// 	const knowledgeMap = new Map<KnowledgeId, Knowledge>();

// 	raw.forEach((item) => {
// 		const content = {
// 			id: item.knowledgeContentId,
// 			name: item.knowledgeContentName,
// 			status: item.knowledgeContentOpenaiStatus,
// 		};

// 		knowledgeMap.set(item.knowledgeId, {
// 			id: item.knowledgeId,
// 			name: item.knowledgeName,
// 			contents: [
// 				...(knowledgeMap.get(item.knowledgeId)?.contents || []),
// 				content,
// 			],
// 		});
// 	});
// 	return Array.from(knowledgeMap.values());
// };
