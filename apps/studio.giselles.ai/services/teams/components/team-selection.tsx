import { getAccountInfo } from "@/app/(main)/settings/account/actions";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { fetchCurrentTeam, fetchUserTeams } from "../";
import { isProPlan } from "../utils";
import TeamCreation from "./team-creation";
import { TeamSelectionForm } from "./team-selection-form";

export async function TeamSelection() {
	const allTeams = await fetchUserTeams();
	const currentTeam = await fetchCurrentTeam();
	const { displayName, email, avatarUrl } = await getAccountInfo();

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
			currentUser={
				<>
					<AvatarImage
						width={24}
						height={24}
						avatarUrl={avatarUrl}
						alt={displayName || email || ""}
						className="w-6 h-6"
					/>
					<span className="text-white-400 font-medium text-[14px] leading-[20.4px] font-sans">
						{displayName || "No display name"}
					</span>
				</>
			}
			teamCreation={
				<TeamCreation>
					<span className="text-white-400 font-medium text-[14px] leading-[20.4px] font-sans">
						Create team
					</span>
				</TeamCreation>
			}
		/>
	);
}
