"use server";

import {
	db,
	fileOpenaiFileRepresentations,
	files,
	knowledgeContentOpenaiVectorStoreFileRepresentations,
	knowledgeContents,
	knowledgeOpenaiVectorStoreRepresentations,
	knowledges,
} from "@/drizzle";
import { openai } from "@/lib/openai";
import { createId } from "@paralleldrive/cuid2";
import { put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import type { KnowledgeContentType, KnowledgeId } from "../types";
import { revalidateGetKnowledgeContents } from "./get-knowledge-contents";

type AddContentToKnowledgeArgs = {
	knowledgeId: KnowledgeId;
	content: {
		name: string;
		type: KnowledgeContentType;
		file: File;
	};
};
/**
 * Adds content to a knowledge base and processes it for AI-assisted retrieval.
 *
 * @description
 * This function performs the following steps:
 * 1. Uploads the file to a blob storage and makes it publicly accessible.
 * 2. Retrieves the database ID of the specified knowledge base.
 * 3. Begins a database transaction to ensure data consistency:
 *    a. Inserts a new file record in the database.
 *    b. Inserts a new knowledge content record, linking it to the file and knowledge base.
 *    c. Uploads the file to OpenAI for use with their AI assistants.
 *    d. Creates a file representation in OpenAI's vector store for the knowledge base.
 *    e. Links the knowledge content to the OpenAI vector store file representation.
 * 4. Revalidates the knowledge contents cache.
 *
 * This process enables the uploaded content to be used in AI-assisted knowledge retrieval
 * and ensures all necessary records and representations are created and linked properly.
 */
export const addKnowledgeContent = async (args: AddContentToKnowledgeArgs) => {
	const blob = await put(args.content.file.name, args.content.file, {
		access: "public",
		contentType: args.content.file.type,
	});
	const [knowledge] = await db
		.select({ dbId: knowledges.dbId })
		.from(knowledges)
		.where(eq(knowledges.id, args.knowledgeId));
	await db.transaction(async (tx) => {
		const [file] = await tx
			.insert(files)
			.values({
				id: `fl_${createId()}`,
				fileName: args.content.file.name,
				fileType: args.content.file.type,
				fileSize: args.content.file.size,
				blobUrl: blob.url,
			})
			.returning({ id: files.id, dbId: files.dbId });

		const [knowledgeContent] = await tx
			.insert(knowledgeContents)
			.values({
				id: `knwl.cnt_${createId()}`,
				name:
					args.content.type === "text"
						? args.content.name.replace(/\.[^.]+$/, "")
						: args.content.name,
				type: args.content.type,
				fileDbId: file.dbId,
				knowledgeDbId: knowledge.dbId,
			})
			.returning({ id: knowledgeContents.id, dbId: knowledgeContents.dbId });

		const openaiFile = await openai.files.create({
			file: args.content.file,
			purpose: "assistants",
		});
		await tx.insert(fileOpenaiFileRepresentations).values({
			fileDbId: file.dbId,
			openaiFileId: openaiFile.id,
		});
		const [openaiVectorStore] = await tx
			.select({
				id: knowledgeOpenaiVectorStoreRepresentations.openaiVectorStoreId,
			})
			.from(knowledgeOpenaiVectorStoreRepresentations)
			.where(
				and(
					eq(
						knowledgeOpenaiVectorStoreRepresentations.knowledgeDbId,
						knowledge.dbId,
					),
				),
			);
		const openaiVectorStoreFile = await openai.beta.vectorStores.files.create(
			openaiVectorStore.id,
			{
				file_id: openaiFile.id,
			},
		);

		await tx
			.insert(knowledgeContentOpenaiVectorStoreFileRepresentations)
			.values({
				knowledgeContentDbId: knowledgeContent.dbId,
				openaiVectorStoreFileId: openaiVectorStoreFile.id,
				openaiVectorStoreFileStatus: "in_progress",
			});
	});
	await revalidateGetKnowledgeContents(args.knowledgeId);
};
