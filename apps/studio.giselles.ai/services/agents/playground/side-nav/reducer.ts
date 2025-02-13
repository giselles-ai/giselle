import type { SideNav, SideNavState } from "./types";

export type SideNavAction =
	| {
			type: "OPEN";
			active: SideNav;
	  }
	| {
			type: "CLOSE";
	  };

export const sideNavReducer = (
	state: SideNavState,
	action: SideNavAction,
): SideNavState => {
	switch (action.type) {
		case "OPEN":
			return { open: true, active: action.active };
		case "CLOSE":
			return { open: false };
		default:
			return state;
	}
};
