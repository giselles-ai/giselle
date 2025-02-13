export const headers: Record<string, string> = {
	"signoz-access-token": process.env.SIGNOZ_INGESTION_TOKEN ?? "",
};
