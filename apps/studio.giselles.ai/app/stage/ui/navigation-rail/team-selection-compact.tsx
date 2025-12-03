"use client";

import { use } from "react";
import { TeamCreationForm } from "@/services/teams/components/team-creation-form";
import { TeamSelectionForm } from "@/services/teams/components/team-selection-form";
import type { UserDataForNavigationRail } from "./types";

export function TeamSelectionCompact({
	userPromise,
}: {
	userPromise: Promise<UserDataForNavigationRail>;
}) {
	const user = use(userPromise);
	if (!user.allTeams) return null;
	return (
		<TeamSelectionForm
			allTeams={user.allTeams}
			currentTeam={user.currentTeam}
			teamCreation={
				<TeamCreationForm
					canCreateFreeTeam={user.canCreateFreeTeam}
					proPlanPrice="$20"
				>
					<span className="text-inverse font-medium text-[14px] leading-[20.4px] font-sans">
						Create team
					</span>
				</TeamCreationForm>
			}
			triggerClassName="w-full max-w-none"
		/>
	);
}
