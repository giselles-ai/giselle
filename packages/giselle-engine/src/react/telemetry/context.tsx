import { createContext, type ReactNode, useContext } from "react";
import type { TelemetrySettings } from "../../core/telemetry";

export const TelemetryContext = createContext<TelemetrySettings | undefined>(
	undefined,
);

export function TelemetryProvider({
	children,
	settings,
}: {
	children: ReactNode;
	settings?: TelemetrySettings;
}) {
	return (
		<TelemetryContext.Provider value={settings}>
			{children}
		</TelemetryContext.Provider>
	);
}

export const useTelemetry = () => {
	const settings = useContext(TelemetryContext);
	return settings;
};
