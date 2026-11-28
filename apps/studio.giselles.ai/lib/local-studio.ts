export const isLocalStudio =
	process.env.NODE_ENV === "development" &&
	process.env.GISELLE_LOCAL_STUDIO === "1";

export function localStudioSetting(key: "POSTGRES_URL" | "GISELLE_DATA_DIR") {
	const value = process.env[key];
	if (!value)
		throw new Error(`Local Studio requires ${key}. Start with pnpm dev:local.`);
	return value;
}
