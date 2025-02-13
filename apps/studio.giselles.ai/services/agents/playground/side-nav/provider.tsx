import { type FC, type PropsWithChildren, useReducer } from "react";
import { SideNavContext } from "./context";
import { sideNavReducer } from "./reducer";

export const SideNavProvider: FC<PropsWithChildren> = ({ children }) => {
	const [state, dispatch] = useReducer(sideNavReducer, { open: false });

	return (
		<SideNavContext.Provider value={{ state, dispatch }}>
			{children}
		</SideNavContext.Provider>
	);
};
