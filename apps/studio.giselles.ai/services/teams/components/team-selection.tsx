import { fetchCurrentTeam, fetchUserTeams } from "../";
import { TeamSelectionForm } from "./team-selection-form";

export async function TeamSelection() {
	const _allTeams = await fetchUserTeams();
	const _currentTeam = await fetchCurrentTeam();

	const allTeams = _allTeams.map(({ id, name }) => ({
		id,
		name,
	}));

	const currentTeam = {
		id: _currentTeam.id,
		name: _currentTeam.name,
	};

	return (
		<TeamSelectionForm
			allTeams={allTeams}
			currentTeam={currentTeam}
			key={currentTeam.id}
		/>
	);
}
