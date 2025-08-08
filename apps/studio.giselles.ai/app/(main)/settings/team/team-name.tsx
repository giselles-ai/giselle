import { fetchCurrentTeam } from "@/services/teams";
import { TeamNameForm } from "./team-name-form";

export async function TeamName() {
	const currentTeam = await fetchCurrentTeam();
	return (
		<div>
			<TeamNameForm
				key={currentTeam.id}
				id={currentTeam.id}
				name={currentTeam.name}
				profileImageUrl={currentTeam.profileImageUrl}
			/>
		</div>
	);
}
