import { WorkspaceId } from "@giselle-sdk/data-type";
import { createIdGenerator } from "@giselle-sdk/utils";
import { z } from "zod/v4";
import { VectorStoreId } from "../../experimental_vector-store/types/object";

export const DataSourceId = createIdGenerator("ds");
export type DataSourceId = z.infer<typeof DataSourceId.schema>;
const DataSourceObjectBase = z.object({
	id: DataSourceId.schema,
	status: z.enum(["inProgress", "completed", "failed"]),
	vectorStoreId: VectorStoreId.schema,
	provider: z.string(),
	providerOptions: z.record(
		z.string(),
		z.union([z.string(), z.number(), z.boolean()]),
	),
	workspaceId: WorkspaceId.schema,
});

const GitHubDataSourceProviderObject = z.object({
	provider: z.literal("github"),
	providerOptions: z.object({
		repositoryNodeId: z.string(),
		installationId: z.number(),
	}),
});
const GitHubDataSourceObject = DataSourceObjectBase.extend(
	GitHubDataSourceProviderObject.shape,
);

export const DataSourceObject = z.discriminatedUnion("provider", [
	GitHubDataSourceObject,
]);
export type DataSourceObject = z.infer<typeof DataSourceObject>;

export const DataSourceProviderObject = z.discriminatedUnion("provider", [
	GitHubDataSourceProviderObject,
]);
export type DataSourceProviderObject = z.infer<typeof DataSourceProviderObject>;

export const DataSourceIndexObject = DataSourceObjectBase.pick({
	id: true,
	workspaceId: true,
});
