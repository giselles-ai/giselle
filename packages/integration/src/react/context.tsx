import {
	type PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useState,
} from "react";
import type { Integration } from "../schema";

interface IntegrationContextValue {
	value: Integration[];
	refresh: () => Promise<void>;
}
export const IntegrationContext = createContext<
	IntegrationContextValue | undefined
>(undefined);

export interface IntegrationContextProps {
	value?: Integration[];
	refresh?: () => Promise<Integration[]>;
}

export function IntegrationProvider({
	children,
	...props
}: PropsWithChildren<IntegrationContextProps>) {
	const [value, setValues] = useState<Integration[]>(props.value ?? []);
	const refresh = useCallback(async () => {
		const newValue = await props.refresh?.();
		setValues(newValue ?? []);
	}, [props.refresh]);
	return (
		<IntegrationContext.Provider
			value={{
				value,
				refresh,
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
