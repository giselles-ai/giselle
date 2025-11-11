"use client";

import { use } from "react";
import { TeamSelectionForm } from "@/services/teams/components/team-selection-form";
import type { UserDataForNavigationRail } from "./types";

export function TeamSelectionCompact({
	userPromise,
}: {
	userPromise: Promise<UserDataForNavigationRail>;
}) {
	const user = use(userPromise);
	if (!user.allTeams || !user.currentTeam) return null;
	return (
		<TeamSelectionForm
			allTeams={user.allTeams}
			currentTeam={user.currentTeam}
			teamCreation={<span>Create team</span>}
			triggerClassName="w-full max-w-none"
		/>
	);
}
