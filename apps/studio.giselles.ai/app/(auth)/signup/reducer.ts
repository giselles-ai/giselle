import type { SignupState } from "./types";

export type SignupAction = {
	type: "SET_EMAIL";
	email: string;
};

export const signupReducer = (
	state: SignupState,
	action: SignupAction,
): SignupState => {
	switch (action.type) {
		case "SET_EMAIL":
			return {
				...state,
				email: action.email,
			};
		default:
			return state;
	}
};
