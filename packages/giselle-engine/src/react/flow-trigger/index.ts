import type { FlowTrigger } from "@giselle-sdk/data-type";
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
	if (!context) {
		throw new Error("useFlowTrigger must be used within a FlowTriggerProvider");
	}
	return context;
}
