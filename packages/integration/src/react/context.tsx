"use client";

import {
	type PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useState,
} from "react";
import type { Integration } from "../schema";

type IntegrationContextValue = {
	state: Integration;
	reloadState: () => void;
};
export const IntegrationContext = createContext<
	IntegrationContextValue | undefined
>(undefined);

export interface IntegrationProviderProps {
	state?: Partial<Integration>;
	reloadState?: () => Promise<Partial<Integration>>;
}
export function IntegrationProvider({
	children,
	...props
}: PropsWithChildren<IntegrationProviderProps | undefined>) {
	const [state, setState] = useState({
		github: props.state?.github,
	});
	const reloadState = useCallback(async () => {
		const newState = await props?.reloadState?.();
		setState({
			github: newState?.github,
		});
	}, [props.reloadState]);

	return (
		<IntegrationContext.Provider
			value={{
				state,
				reloadState,
			}}
		>
			{children}
		</IntegrationContext.Provider>
	);
}

export const useIntegration = () => {
	const integration = useContext(IntegrationContext);
	if (!integration) {
		throw new Error(
			"useIntegration must be used within an IntegrationProvider",
		);
	}
	return integration;
};
