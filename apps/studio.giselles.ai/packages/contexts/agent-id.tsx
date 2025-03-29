"use client";

import type { AgentId } from "@giselles-ai/types";
import { createContext, useContext } from "react";

const AgentIdContext = createContext<AgentId | null>(null);

export function useAgentId() {
	const context = useContext(AgentIdContext);
	if (!context) {
		throw new Error("useAgentId must be used within an AgentIdProvider");
	}
	return context;
}

export function AgentIdProvider({
	children,
	value,
}: {
	children: React.ReactNode;
	value: AgentId | null;
}) {
	return (
		<AgentIdContext.Provider value={value}>{children}</AgentIdContext.Provider>
	);
}
