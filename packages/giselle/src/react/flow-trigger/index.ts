import type { FlowTrigger } from "@giselles-ai/protocol";
import { createContext, useContext } from "react";

type FlowTriggerUpdateCallback = (flowTrigger: FlowTrigger) => Promise<void>;
export interface FlowTriggerContextValue {
	callbacks?: {
		flowTriggerUpdate?: FlowTriggerUpdateCallback;
	};
}

export const FlowTriggerContext = createContext<
	FlowTriggerContextValue | undefined
>(undefined);

export function useFlowTrigger() {
	const context = useContext(FlowTriggerContext);
	if (context === undefined) {
		throw new Error("useFlowTrigger must be used within a FlowTriggerProvider");
	}
	return context;
}
