import { type Dispatch, createContext, useContext } from "react";
import type { SideNavAction } from "./reducer";
import type { SideNavState } from "./types";

type SideNavContext = {
	state: SideNavState;
	dispatch: Dispatch<SideNavAction>;
};
export const SideNavContext = createContext<SideNavContext | null>(null);

export const useSideNav = () => {
	const context = useContext(SideNavContext);
	if (!context) {
		throw new Error("useSideNav must be used within a SideNavProvider");
	}
	return context;
};
