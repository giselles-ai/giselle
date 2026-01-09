import * as z from "zod/v4";

export const dataStoreRegistry = [
	{
		provider: "postgres",
		label: "PostgreSQL",
		configurationSchema: z.object({
			connectionStringSecretId: z.string().min(1),
		}),
	},
] as const;

export type DataStoreProvider = (typeof dataStoreRegistry)[number]["provider"];

const dataStoreProviders = dataStoreRegistry.map((x) => x.provider);

export function isDataStoreProvider(v: unknown): v is DataStoreProvider {
	return dataStoreProviders.includes(v as DataStoreProvider);
}

export function getDataStoreProviderDefinition(provider: DataStoreProvider) {
	const def = dataStoreRegistry.find((x) => x.provider === provider);
	if (!def) throw new Error(`Unknown data store provider: ${provider}`);
	return def;
}

export function parseDataStoreConfiguration(
	provider: DataStoreProvider,
	unknownConfig: unknown,
) {
	const def = getDataStoreProviderDefinition(provider);
	const parsed = def.configurationSchema.safeParse(unknownConfig);
	if (!parsed.success) throw parsed.error;
	return parsed.data;
}
