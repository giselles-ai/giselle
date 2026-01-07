import { notFound } from "next/navigation";
import { listApiSecretRecordsForTeam } from "@/lib/api-keys";
import { fetchCurrentTeam } from "@/services/teams";
import { apiPublishingFlag } from "../../../../../flags";
import { ApiKeysPageClient } from "./page-client";

export default async function ApiKeysPage() {
	const isApiPublishingEnabled = await apiPublishingFlag();
	if (!isApiPublishingEnabled) {
		notFound();
	}

	const team = await fetchCurrentTeam();
	const apiKeys = await listApiSecretRecordsForTeam(team.dbId);

	return <ApiKeysPageClient apiKeys={apiKeys} />;
}
