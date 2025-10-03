import { beforeAll, describe, expect, it } from "vitest";

import type { DocumentVectorStoreMetadata } from "./schema";
import { getDocumentVectorStoreQueryService } from "./service";

let documentVectorStoreQueryService: ReturnType<
	typeof getDocumentVectorStoreQueryService
>;

beforeAll(() => {
	if (!process.env.POSTGRES_URL) {
		process.env.POSTGRES_URL = "postgres://placeholder";
	}
	documentVectorStoreQueryService = getDocumentVectorStoreQueryService();
});

describe("documentVectorStoreQueryService", () => {
	it("exposes a search method", () => {
		expect(typeof documentVectorStoreQueryService.search).toBe("function");
	});

	it("exports metadata type shape", () => {
		const metadata: DocumentVectorStoreMetadata = {
			documentVectorStoreSourceDbId: 1,
			documentKey: "sample.txt",
		};
		expect(metadata.documentKey).toBe("sample.txt");
	});
});
