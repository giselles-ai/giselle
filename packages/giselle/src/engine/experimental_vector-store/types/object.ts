import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod/v4";

export const VectorStoreId = createIdGenerator("vs");
export type VectorStoreId = z.infer<typeof VectorStoreId.schema>;

const InternalVectorStoreObjectBase = z.object({
	id: VectorStoreId.schema,
	name: z.string(),
});
const InternalOpenAIVectorStoreObject = InternalVectorStoreObjectBase.extend({
	provider: z.literal("openai"),
	providerOptions: z.object({
		id: z.string(),
	}),
});
export const InternalVectorStoreObject = z.discriminatedUnion("provider", [
	InternalOpenAIVectorStoreObject,
]);

export type InternalVectorStoreObject = z.infer<
	typeof InternalVectorStoreObject
>;

const VectorStoreObjectBase = z.object({
	id: VectorStoreId.schema,
	name: z.string(),
	fileCounts: z.object({
		cancelled: z.number(),
		completed: z.number(),
		failed: z.number(),
		inProgress: z.number(),
		total: z.number(),
	}),
});
const OpenAIVectorStoreObject = VectorStoreObjectBase.extend({
	provider: z.literal("openai"),
	providerOptions: z.object({
		id: z.string(),
	}),
});
const VectorStoreObject = z.discriminatedUnion("provider", [
	OpenAIVectorStoreObject,
]);

export type VectorStoreObject = z.infer<typeof VectorStoreObject>;

export const VectorStoreFileId = createIdGenerator("vsf");

const VectorStoreFileObjectBase = z.object({
	id: VectorStoreFileId.schema,
	vectorStoreId: VectorStoreId.schema,
});
const OpenAIVectorStoreFileObject = VectorStoreFileObjectBase.extend({
	provider: z.literal("openai"),
	providerOptions: z.object({
		id: z.string(),
	}),
});
export const VectorStoreFileObject = z.discriminatedUnion("provider", [
	OpenAIVectorStoreFileObject,
]);
