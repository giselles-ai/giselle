import type { UsageLimits } from "@giselles-ai/giselle";
import { createContext, type ReactNode, useContext } from "react";

export const UsageLimitsContext = createContext<UsageLimits | undefined>(
	undefined,
);

export function UsageLimitsProvider({
	children,
	limits,
}: {
	children: ReactNode;
	limits?: UsageLimits;
}) {
	return (
		<UsageLimitsContext.Provider value={limits}>
			{children}
		</UsageLimitsContext.Provider>
	);
}

export const useUsageLimits = () => {
	const limits = useContext(UsageLimitsContext);
	return limits;
};
