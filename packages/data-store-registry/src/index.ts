export const dataStoreRegistry = [
	{
		provider: "postgres",
		label: "PostgreSQL",
	},
] as const;

export type DataStoreProvider = (typeof dataStoreRegistry)[number]["provider"];
