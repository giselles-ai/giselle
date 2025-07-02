import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useState,
} from "react";
import type { Integration } from "../../core/integrations";

interface IntegrationContextValue {
	value: Partial<Integration>;
	refresh: () => Promise<void>;
}

export const IntegrationContext = createContext<
	IntegrationContextValue | undefined
>(undefined);

export interface IntegrationProviderProps {
	value?: Partial<Integration>;
	refresh?: () => Promise<Partial<Integration>>;
}

export function IntegrationProvider({
	children,
	...props
}: PropsWithChildren<IntegrationProviderProps>) {
	const [value, setValues] = useState<Partial<Integration>>(props.value ?? {});
	const refresh = useCallback(async () => {
		const newValue = await props.refresh?.();
		setValues(newValue ?? {});
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
