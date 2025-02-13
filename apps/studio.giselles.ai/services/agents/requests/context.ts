import { type Dispatch, createContext, useContext } from "react";
import type { RequestAction } from "./reducer";
import type { RequestState } from "./types";

type RequestContext = {
	state: RequestState;
	onBeforeRequestStartAction: () => Promise<void>;
	dispatch: Dispatch<RequestAction>;
};
export const RequestContext = createContext<RequestContext | null>(null);

export const useRequest = () => {
	const context = useContext(RequestContext);
	if (!context) {
		throw new Error("useRequest must be used within a RequestProvider");
	}
	return context;
};
