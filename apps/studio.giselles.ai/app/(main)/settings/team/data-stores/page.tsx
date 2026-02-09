import { notFound } from "next/navigation";
import { fetchCurrentTeam } from "@/services/teams";
import { isInternalPlan } from "@/services/teams/utils";
import { getDataStores } from "./actions";
import { DataStoresPageClient } from "./page-client";

export default async function DataStoresPage() {
	const team = await fetchCurrentTeam();
	if (!isInternalPlan(team)) {
		notFound();
	}

	const dataStores = await getDataStores();

	return <DataStoresPageClient dataStores={dataStores} />;
}
