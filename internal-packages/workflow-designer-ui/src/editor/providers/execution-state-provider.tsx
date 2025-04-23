import type React from "react";
import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";

export type NodeStatus =
	| "idle"
	| "running"
	| "completed"
	| "failed"
	| "selected";

export interface NodeExecutionState {
	id: string;
	status: NodeStatus;
	errorMessage?: string;
	progress?: number;
}

interface ExecutionStateContextType {
	nodeStates: Record<string, NodeExecutionState>;
	updateNodeState: (nodeId: string, state: Partial<NodeExecutionState>) => void;
	resetNodeState: (nodeId: string) => void;
	resetAllNodeStates: () => void;
}

const ExecutionStateContext = createContext<ExecutionStateContextType | undefined>(
	undefined
);

export const useExecutionState = () => {
	const context = useContext(ExecutionStateContext);
	if (!context) {
		throw new Error(
			"useExecutionState must be used within an ExecutionStateProvider"
		);
	}
	return context;
};

interface ExecutionStateProviderProps {
	children: ReactNode;
}

export const ExecutionStateProvider: React.FC<ExecutionStateProviderProps> = ({
	children,
}) => {
	const [nodeStates, setNodeStates] = useState<Record<string, NodeExecutionState>>(
		{}
	);

	const updateNodeState = (
		nodeId: string,
		state: Partial<NodeExecutionState>
	) => {
		setNodeStates((prev) => {
			const currentState = prev[nodeId] || { id: nodeId, status: "idle" };
			return {
				...prev,
				[nodeId]: {
					...currentState,
					...state,
				},
			};
		});
	};

	const resetNodeState = (nodeId: string) => {
		setNodeStates((prev) => {
			const { [nodeId]: _, ...rest } = prev;
			return rest;
		});
	};

	const resetAllNodeStates = () => {
		setNodeStates({});
	};

	const value = {
		nodeStates,
		updateNodeState,
		resetNodeState,
		resetAllNodeStates,
	};

	return (
		<ExecutionStateContext.Provider value={value}>
			{children}
		</ExecutionStateContext.Provider>
	);
}; 