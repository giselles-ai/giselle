import { fetchCurrentTeam, fetchUserTeams } from "../";
import { isProPlan } from "../utils";
import TeamCreation from "./team-creation";
import { TeamSelectionForm } from "./team-selection-form";

export async function TeamSelection() {
	const allTeams = await fetchUserTeams();
	const currentTeam = await fetchCurrentTeam();

	const formattedAllTeams = allTeams.map((team) => ({
		id: team.id,
		name: team.name,
		avatarUrl: team.avatarUrl,
		isPro: isProPlan(team),
	}));

	const formattedCurrentTeam = {
		id: currentTeam.id,
		name: currentTeam.name,
		avatarUrl: currentTeam.avatarUrl,
		isPro: isProPlan(currentTeam),
	};

	return (
		<TeamSelectionForm
			allTeams={formattedAllTeams}
			currentTeam={formattedCurrentTeam}
			key={currentTeam.id}
			teamCreation={
				<TeamCreation>
					<span className="text-inverse font-medium text-[14px] leading-[20.4px] font-sans">
						Create team
					</span>
				</TeamCreation>
			}
		/>
	);
}
