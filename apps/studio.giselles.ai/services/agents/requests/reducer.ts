import type { Request, RequestId, RequestState } from "./types";

export type RequestAction = {
	type: "SET_REQUEST";
	request: Request;
};

export const requestReducer = (
	state: RequestState,
	action: RequestAction,
): RequestState => {
	switch (action.type) {
		case "SET_REQUEST":
			return { ...state, request: action.request };
		default:
			return state;
	}
};
