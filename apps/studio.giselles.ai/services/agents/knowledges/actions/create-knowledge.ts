// "use server";

// import {
// 	db,
// 	knowledgeOpenaiVectorStoreRepresentations,
// 	knowledges,
// } from "@/drizzle";
// import { openai } from "@/lib/openai";

// type CreateKnowledgeArgs = {
// 	knowledge: {
// 		name: string;
// 	};
// 	blueprintId: number;
// };
// export const createKnowledge = async (args: CreateKnowledgeArgs) => {
// 	const [knowledge] = await db
// 		.insert(knowledges)
// 		.values({
// 			name: args.knowledge.name,
// 			blueprintId: args.blueprintId,
// 		})
// 		.returning({
// 			id: knowledges.id,
// 		});
// 	const vectorStore = await openai.beta.vectorStores.create({
// 		name: args.knowledge.name,
// 	});
// 	await db.insert(knowledgeOpenaiVectorStoreRepresentations).values({
// 		knowledgeId: knowledge.id,
// 		openaiVectorStoreId: vectorStore.id,
// 		status: vectorStore.status,
// 	});
// 	return {
// 		blueprintId: args.blueprintId,
// 		knowledge: {
// 			id: knowledge.id,
// 			name: args.knowledge.name,
// 			contents: [],
// 			openaiVectorStoreId: vectorStore.id,
// 		},
// 	};
// };
