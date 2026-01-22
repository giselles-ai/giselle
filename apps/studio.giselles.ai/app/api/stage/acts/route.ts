import { fetchEnrichedActs } from "@/app/(main)/stage/(depreacted)/services";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchUserTeams } from "@/services/teams";

export async function GET() {
	const teams = await fetchUserTeams();
	const user = await fetchCurrentUser();
	const acts = await fetchEnrichedActs(teams, user);

	// Convert to ActWithNavigation format
	const actsWithNavigation = acts.map((act) => ({
		id: act.id,
		status: act.status,
		createdAt: act.createdAt.toISOString(),
		link: act.link,
		teamName: act.teamName,
		workspaceName: act.workspaceName,
		llmModels: undefined,
		inputValues: undefined,
	}));

	return Response.json(actsWithNavigation);
}
