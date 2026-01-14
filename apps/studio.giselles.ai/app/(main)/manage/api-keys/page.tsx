import { notFound, redirect } from "next/navigation";
import { fetchCurrentTeam } from "@/services/teams";
import { isInternalPlan } from "@/services/teams/utils";

export default async function ApiKeysPage() {
	const team = await fetchCurrentTeam();
	if (!isInternalPlan(team)) {
		notFound();
	}
	redirect("/settings/team/api-keys");
}
