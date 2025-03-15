import { fetchCurrentTeam } from "@/services/teams";
import { TeamNameForm } from "../v2/team-name-form";

export async function TeamName() {
	const currentTeam = await fetchCurrentTeam();
	return (
		<div>
			<TeamNameForm
				key={currentTeam.id}
				id={currentTeam.id}
				name={currentTeam.name}
			/>
		</div>
	);
}
