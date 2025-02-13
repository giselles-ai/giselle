"use client";

import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useOptimistic,
	useState,
	useTransition,
} from "react";

const AgentNameContext = createContext<
	| {
			agentName: string | null;
			updateAgentName: (name: string) => Promise<void>;
			isPending: boolean;
	  }
	| undefined
>(undefined);

export function useAgentName() {
	const context = useContext(AgentNameContext);
	if (!context) {
		throw new Error("useAgentName must be used within an AgentNameProvider");
	}
	return context;
}

export function AgentNameProvider({
	children,
	defaultValue,
	updateAgentNameAction,
}: {
	children: ReactNode;
	defaultValue: string | null;
	updateAgentNameAction: (name: string | null) => Promise<string | null>;
}) {
	const [serverAgentName, setServerAgentName] = useState(defaultValue);
	const [agentName, setAgentName] = useOptimistic<string | null, string | null>(
		serverAgentName,
		(_, newAgentName) => newAgentName,
	);
	const [isPending, startTransition] = useTransition();

	const handleUpdateAgentName = useCallback(
		async (newAgentName: string) => {
			if (agentName === newAgentName) {
				return;
			}
			const nullableAgentName =
				newAgentName.trim() === "" ? null : newAgentName;
			startTransition(async () => {
				setAgentName(nullableAgentName);
				const updatedAgentName = await updateAgentNameAction(nullableAgentName);
				setServerAgentName(nullableAgentName);
			});
		},
		[agentName, setAgentName, updateAgentNameAction],
	);
	return (
		<AgentNameContext.Provider
			value={{
				agentName,
				updateAgentName: handleUpdateAgentName,
				isPending,
			}}
		>
			{children}
		</AgentNameContext.Provider>
	);
}
