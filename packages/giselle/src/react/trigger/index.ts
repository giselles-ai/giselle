import type { Trigger } from "@giselles-ai/protocol";
import { createContext, useContext } from "react";

type TriggerUpdateCallback = (flowTrigger: Trigger) => Promise<void>;
export interface TriggerContextValue {
	callbacks?: {
		triggerUpdate?: TriggerUpdateCallback;
	};
}

export const TriggerContext = createContext<TriggerContextValue | undefined>(
	undefined,
);

export function useTrigger() {
	const context = useContext(TriggerContext);
	if (context === undefined) {
		throw new Error("useFlowTrigger must be used within a FlowTriggerProvider");
	}
	return context;
}
