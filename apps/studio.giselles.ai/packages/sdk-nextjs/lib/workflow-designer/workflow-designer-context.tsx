"use client";

import { useCompletion } from "ai/react";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import type { z } from "zod";
import type { NodeData, WorkflowData } from "../workflow-data";
import type { CreateTextGenerationNodeParams } from "../workflow-data/node/actions/text-generation";
import { createConnectionHandle as createConnectionHandleData } from "../workflow-data/node/connection";
import type { ConnectionHandle, NodeId } from "../workflow-data/node/types";
import type { CreateTextNodeParams } from "../workflow-data/node/variables/text";
import { callSaveWorkflowApi } from "./call-save-workflow-api";
import {
	WorkflowDesigner,
	type WorkflowDesignerOperations,
} from "./workflow-designer";

interface WorkflowDesignerContextValue
	extends Pick<
		WorkflowDesignerOperations,
		"addTextGenerationNode" | "updateNodeData" | "addConnection" | "addTextNode"
	> {
	data: WorkflowData;
	textGenerationApi: string;
}
const WorkflowDesignerContext = createContext<
	WorkflowDesignerContextValue | undefined
>(undefined);

export function WorkflowDesignerProvider({
	children,
	data,
	saveWorkflowApi = "/api/workflow/save-workflow",
	textGenerationApi = "/api/workflow/text-generation",
}: {
	children: React.ReactNode;
	data: WorkflowData;
	saveWorkflowApi?: string;
	textGenerationApi?: string;
}) {
	const workflowDesignerRef = useRef(
		WorkflowDesigner({
			defaultValue: data,
		}),
	);
	const [workflowData, setWorkflowData] = useState(data);
	const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isPendingPersistRef = useRef(false);

	const saveWorkflowData = useCallback(async () => {
		isPendingPersistRef.current = false;
		try {
			await callSaveWorkflowApi({
				api: saveWorkflowApi,
				workflowId: workflowData.id,
				workflowData,
			});
		} catch (error) {
			console.error("Failed to persist graph:", error);
		}
	}, [saveWorkflowApi, workflowData]);

	const setAndSaveWorkflowData = useCallback(
		(data: WorkflowData) => {
			setWorkflowData(data);

			isPendingPersistRef.current = true;
			if (persistTimeoutRef.current) {
				clearTimeout(persistTimeoutRef.current);
			}
			persistTimeoutRef.current = setTimeout(saveWorkflowData, 500);
		},
		[saveWorkflowData],
	);

	const addTextGenerationNode = useCallback(
		(params: z.infer<typeof CreateTextGenerationNodeParams>) => {
			if (workflowDesignerRef.current === undefined) {
				return;
			}
			workflowDesignerRef.current.addTextGenerationNode(params);
			setAndSaveWorkflowData(workflowDesignerRef.current.getData());
		},
		[setAndSaveWorkflowData],
	);

	const updateNodeData = useCallback(
		(nodeId: NodeId, data: NodeData) => {
			if (workflowDesignerRef.current === undefined) {
				return;
			}
			workflowDesignerRef.current.updateNodeData(nodeId, data);
			setAndSaveWorkflowData(workflowDesignerRef.current.getData());
		},
		[setAndSaveWorkflowData],
	);

	const addConnection = useCallback(
		(sourceNode: NodeData, targetHandle: ConnectionHandle) => {
			workflowDesignerRef.current?.addConnection(sourceNode, targetHandle);
			setAndSaveWorkflowData(workflowDesignerRef.current.getData());
		},
		[setAndSaveWorkflowData],
	);

	const addTextNode = useCallback(
		(params: z.infer<typeof CreateTextNodeParams>) => {
			if (workflowDesignerRef.current === undefined) {
				return;
			}
			workflowDesignerRef.current.addTextNode(params);
			setAndSaveWorkflowData(workflowDesignerRef.current.getData());
		},
		[setAndSaveWorkflowData],
	);

	return (
		<WorkflowDesignerContext.Provider
			value={{
				data: workflowData,
				textGenerationApi,
				addTextGenerationNode,
				addTextNode,
				addConnection,
				updateNodeData,
			}}
		>
			{children}
		</WorkflowDesignerContext.Provider>
	);
}

export function useWorkflowDesigner() {
	const context = useContext(WorkflowDesignerContext);
	if (context === undefined) {
		throw new Error(
			"useWorkflowDesigner must be used within a WorkflowDesignerProvider",
		);
	}
	return context;
}

export function useNode(nodeId: NodeId) {
	const {
		data: workflowData,
		textGenerationApi,
		updateNodeData,
		addConnection: addConnectionInternal,
	} = useWorkflowDesigner();

	const data = useMemo(() => {
		const node = workflowData.nodes.get(nodeId);
		if (node === undefined) {
			throw new Error(`Node with id ${nodeId} not found`);
		}
		return node;
	}, [workflowData, nodeId]);

	const { handleSubmit, completion, input, handleInputChange } = useCompletion({
		api: textGenerationApi,
		initialInput:
			data.content.type === "textGeneration" ? data.content.prompt : undefined,
		body: {
			workflowId: workflowData.id,
			nodeId: data.id,
		},
	});

	const updateData = useCallback(
		(newData: Partial<NodeData>) => {
			// @ts-ignore zod types are not working well with partials
			updateNodeData(nodeId, { ...data, ...newData });
		},
		[nodeId, updateNodeData, data],
	);

	const addConnection = useCallback(
		({ sourceNode, label }: { sourceNode: NodeData; label: string }) => {
			const connectionHandle = createConnectionHandleData({
				label,
				nodeId: data.id,
				nodeType: data.type,
			});
			addConnectionInternal(sourceNode, connectionHandle);
			return connectionHandle;
		},
		[data, addConnectionInternal],
	);

	return {
		updateData,
		addConnection,
		handleGeneratingTextSubmit: handleSubmit,
		generatedText: completion,
		prompt: input,
		handlePromptChange: handleInputChange,
	};
}
