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
		isPro: isProPlan(team),
	}));

	const formattedCurrentTeam = {
		id: currentTeam.id,
		name: currentTeam.name,
		isPro: isProPlan(currentTeam),
	};

	return (
		<TeamSelectionForm
			allTeams={formattedAllTeams}
			currentTeam={formattedCurrentTeam}
			key={currentTeam.id}
			teamCreation={
				<TeamCreation>
					<span className="text-white-400 font-medium text-[14px] leading-[20.4px] font-hubot">
						Create team
					</span>
				</TeamCreation>
			}
		/>
	);
}
