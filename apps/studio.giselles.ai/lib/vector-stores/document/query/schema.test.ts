import { describe, expect, it } from "vitest";

import { documentVectorStoreMetadataSchema } from "./schema";

describe("documentVectorStoreMetadataSchema", () => {
	it("parses valid metadata", () => {
		const result = documentVectorStoreMetadataSchema.parse({
			documentVectorStoreSourceDbId: 123,
			documentKey: "example.txt",
		});
		expect(result).toEqual({
			documentVectorStoreSourceDbId: 123,
			documentKey: "example.txt",
		});
	});

	it("rejects invalid metadata", () => {
		expect(() =>
			documentVectorStoreMetadataSchema.parse({
				documentVectorStoreSourceDbId: "not-a-number",
				documentKey: 42,
			}),
		).toThrowError();
	});
});
