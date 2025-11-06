export type NavigationRailState = "expanded" | "collapsed";

export interface UserDataForNavigationRail {
	displayName: string | undefined;
	email: string | undefined;
	avatarUrl: string | undefined;
	planName: string | undefined;
	currentTeam?: {
		isPro: boolean;
		name: string;
		avatarUrl: string | undefined;
	};
}
