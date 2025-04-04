import { type ReactNode, createContext, useContext, useMemo } from "react";
import type { Integration } from "../schema";

export const IntegrationContext = createContext<Integration | undefined>(
	undefined,
);

export function IntegrationProvider({
	children,
	integration,
}: { children: ReactNode; integration?: Partial<Integration> }) {
	const value = useMemo<Integration>(
		() => ({
			github: integration?.github ?? {
				state: integration?.github?.state ?? {
					status: "unset",
				},
				components: integration?.github?.components ?? {},
			},
		}),
		[integration],
	);

	return (
		<IntegrationContext.Provider value={value}>
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
