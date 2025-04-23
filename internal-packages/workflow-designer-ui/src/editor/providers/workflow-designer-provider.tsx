import type { Edge, Node } from "@xyflow/react";
import type React from "react";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useState,
} from "react";

export interface UINodeState {
	isDragging: boolean;
}

export interface WorkflowDesignerContextType {
	nodes: Node[];
	edges: Edge[];
	uiNodeStates: Record<string, UINodeState>;
	setNodes: (nodes: Node[]) => void;
	setEdges: (edges: Edge[]) => void;
	setUINodeState: (nodeId: string, state: Partial<UINodeState>) => void;
	updateNodeData: (node: Node, newData: Partial<Node>) => void;
}

const WorkflowDesignerContext = createContext<
	WorkflowDesignerContextType | undefined
>(undefined);

export const useWorkflowDesigner = () => {
	const context = useContext(WorkflowDesignerContext);
	if (!context) {
		throw new Error(
			"useWorkflowDesigner must be used within a WorkflowDesignerProvider",
		);
	}
	return context;
};

interface WorkflowDesignerProviderProps {
	children: ReactNode;
}

export const WorkflowDesignerProvider: React.FC<
	WorkflowDesignerProviderProps
> = ({ children }) => {
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);
	const [uiNodeStates, setUINodeStates] = useState<Record<string, UINodeState>>(
		{},
	);

	const setUINodeState = useCallback(
		(nodeId: string, state: Partial<UINodeState>) => {
			setUINodeStates((prev) => {
				const currentState = prev[nodeId] || { isDragging: false };
				return {
					...prev,
					[nodeId]: {
						...currentState,
						...state,
					},
				};
			});
		},
		[],
	);

	const updateNodeData = useCallback((node: Node, newData: Partial<Node>) => {
		setNodes((nodes) =>
			nodes.map((n) => {
				if (n.id === node.id) {
					return { ...n, ...newData };
				}
				return n;
			}),
		);
	}, []);

	return (
		<WorkflowDesignerContext.Provider
			value={{
				nodes,
				edges,
				uiNodeStates,
				setNodes,
				setEdges,
				setUINodeState,
				updateNodeData,
			}}
		>
			{children}
		</WorkflowDesignerContext.Provider>
	);
}; 