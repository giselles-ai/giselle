import { notFound } from "next/navigation";
import { listApiSecretRecordsForTeam } from "@/lib/api-keys";
import { fetchCurrentTeam } from "@/services/teams";
import { isInternalPlan } from "@/services/teams/utils";
import { ApiKeysPageClient } from "./page-client";

export default async function ApiKeysPage() {
	const team = await fetchCurrentTeam();
	if (!isInternalPlan(team)) {
		notFound();
	}

	const apiKeys = await listApiSecretRecordsForTeam(team.dbId);

	return <ApiKeysPageClient apiKeys={apiKeys} />;
}
