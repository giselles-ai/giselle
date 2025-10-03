import type { QueryService } from "@giselle-sdk/rag";
import { createPostgresQueryService } from "@giselle-sdk/rag";
import { getTableName } from "drizzle-orm";

import { documentEmbeddings } from "@/drizzle";

import { createDatabaseConfig } from "../../github/database";
import type { DocumentVectorStoreQueryContext } from "./context";
import { resolveDocumentVectorStoreDbId } from "./resolve-document-vector-store";
import {
	type DocumentVectorStoreMetadata,
	documentVectorStoreMetadataSchema,
} from "./schema";

type DocumentVectorStoreQueryService = QueryService<
	DocumentVectorStoreQueryContext,
	DocumentVectorStoreMetadata
>;

let cachedQueryService: DocumentVectorStoreQueryService | undefined;

export function getDocumentVectorStoreQueryService(): DocumentVectorStoreQueryService {
	if (cachedQueryService) {
		return cachedQueryService;
	}

	cachedQueryService = createPostgresQueryService<
		DocumentVectorStoreQueryContext,
		typeof documentVectorStoreMetadataSchema
	>({
		database: createDatabaseConfig(),
		tableName: getTableName(documentEmbeddings),
		metadataSchema: documentVectorStoreMetadataSchema,
		contextToEmbeddingProfileId: (context) => context.embeddingProfileId,
		metadataColumnOverrides: {
			documentVectorStoreSourceDbId:
				documentEmbeddings.documentVectorStoreSourceDbId.name,
			documentKey: documentEmbeddings.documentKey.name,
		},
		contextToFilter: async (context) => {
			const storeDbId = await resolveDocumentVectorStoreDbId(context);
			return {
				[documentEmbeddings.documentVectorStoreDbId.name]: storeDbId,
			};
		},
	});

	return cachedQueryService;
}
