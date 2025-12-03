import type { Team } from "@/services/teams/types";

export type NavigationRailState = "expanded" | "collapsed";

export interface UserDataForNavigationRail {
	enableStage: boolean;
	displayName: string | undefined;
	email: string | undefined;
	avatarUrl: string | undefined;
	currentTeam: Team;
	allTeams?: Team[];
}
