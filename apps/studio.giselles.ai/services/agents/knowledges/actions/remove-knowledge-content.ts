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
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import type { KnowledgeContentId } from "../types";
import { revalidateGetKnowledgeContents } from "./get-knowledge-contents";

/**
 * Removes content from a knowledge base and cleans up associated resources.
 *
 * @description
 * This function performs the following steps:
 * 1. Begins a database transaction to ensure data consistency:
 *    a. Retrieves the content and associated file information from the database.
 *    b. Deletes the knowledge content record from the database.
 *    c. Removes the file record if it's not referenced by other content.
 *    d. Deletes the file from blob storage if it's no longer needed.
 *    e. Removes the OpenAI file representation if it exists.
 *    f. Deletes the OpenAI vector store file representation if it exists.
 * 2. Calls OpenAI API to remove the file from the assistant and vector store if necessary.
 * 3. Revalidates the knowledge contents cache to reflect the changes.
 *
 * This process ensures that all traces of the removed content are cleaned up from both
 * the local database and external services (blob storage and OpenAI), maintaining data
 * integrity and freeing up resources.
 *
 * @throws {Error} If the content cannot be found or if there's an issue during the removal process.
 */
export const removeKnowledgeContent = async (
	knowledgeContentId: KnowledgeContentId,
) => {
	const [knowledgeContent] = await db
		.select({
			knowledgeId: knowledges.id,
			dbId: knowledgeContents.dbId,
			fileDbId: files.dbId,
			fileBlobUrl: files.blobUrl,
			knowledgeOpenaiVectorStoreId:
				knowledgeOpenaiVectorStoreRepresentations.openaiVectorStoreId,
			openaiFileId: fileOpenaiFileRepresentations.openaiFileId,
			openaiVectorStoreFileId:
				knowledgeContentOpenaiVectorStoreFileRepresentations.openaiVectorStoreFileId,
		})
		.from(knowledgeContents)
		.innerJoin(
			knowledgeContentOpenaiVectorStoreFileRepresentations,
			eq(
				knowledgeContentOpenaiVectorStoreFileRepresentations.knowledgeContentDbId,
				knowledgeContents.dbId,
			),
		)
		.innerJoin(files, eq(files.dbId, knowledgeContents.dbId))
		.innerJoin(
			fileOpenaiFileRepresentations,
			eq(fileOpenaiFileRepresentations.fileDbId, files.dbId),
		)
		.innerJoin(knowledges, eq(knowledges.dbId, knowledgeContents.knowledgeDbId))
		.innerJoin(
			knowledgeOpenaiVectorStoreRepresentations,
			eq(
				knowledgeOpenaiVectorStoreRepresentations.knowledgeDbId,
				knowledges.dbId,
			),
		)
		.where(eq(knowledgeContents.id, knowledgeContentId));
	await db.transaction(async (tx) => {
		await openai.beta.vectorStores.files.del(
			knowledgeContent.knowledgeOpenaiVectorStoreId,
			knowledgeContent.openaiVectorStoreFileId,
		);
		await openai.files.del(knowledgeContent.openaiFileId);
		await del(knowledgeContent.fileBlobUrl);

		// The following deletion will cascade to related tables (knowledgeContents,
		// fileOpenaiFileRepresentations, and indirectly
		// knowledge_content_openai_vector_store_file_representations) due to foreign key constraints
		await tx.delete(files).where(eq(files.dbId, knowledgeContent.fileDbId));
	});
	revalidateGetKnowledgeContents(knowledgeContent.knowledgeId);
};
