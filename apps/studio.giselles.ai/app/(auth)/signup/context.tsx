"use client";

import {
	createContext,
	type Dispatch,
	type FC,
	type PropsWithChildren,
	useContext,
	useReducer,
} from "react";
import { type SignupAction, signupReducer } from "./reducer";
import type { SignupState } from "./types";

type SignupContext = {
	state: SignupState;
	dispatch: Dispatch<SignupAction>;
};
const SignupContext = createContext<SignupContext | null>(null);

export const SignupContextProvider: FC<PropsWithChildren> = ({ children }) => {
	const [state, dispatch] = useReducer(signupReducer, { email: "" });
	return (
		<SignupContext.Provider value={{ state, dispatch }}>
			{children}
		</SignupContext.Provider>
	);
};

export const useSignupContext = () => {
	const context = useContext(SignupContext);
	if (!context) {
		throw new Error(
			"useSignupContext must be used within a SignupContextProvider",
		);
	}
	return context;
};
