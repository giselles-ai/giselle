import { fetchCurrentTeam } from "@/services/teams";
import { TeamProfileCard } from "./team-profile-card";

export async function TeamProfile() {
	const currentTeam = await fetchCurrentTeam();
	return (
		<div>
			<TeamProfileCard
				key={currentTeam.id}
				id={currentTeam.id}
				name={currentTeam.name}
				avatarUrl={currentTeam.avatarUrl}
			/>
		</div>
	);
}
