import type { z } from "zod";
import {
	type NodeData,
	type WorkflowData,
	generateInitialWorkflowData,
} from "../workflow-data";
import {
	type CreateTextGenerationNodeParams,
	createTextGenerationNodeData,
} from "../workflow-data/node/actions/text-generation";
import { createConnection } from "../workflow-data/node/connection";
import {
	type BaseNodeData,
	type ConnectionHandle,
	type NodeId,
	connectionId,
} from "../workflow-data/node/types";
import {
	type CreateTextNodeParams,
	createTextNodeData,
} from "../workflow-data/node/variables/text";

export interface WorkflowDesignerOperations {
	addTextGenerationNode: (
		params: z.infer<typeof CreateTextGenerationNodeParams>,
	) => void;
	addTextNode: (params: z.infer<typeof CreateTextNodeParams>) => void;
	getData: () => WorkflowData;
	updateNodeData: (nodeId: NodeId, data: NodeData) => void;
	addConnection: (
		sourceNode: NodeData,
		targetNodeHandle: ConnectionHandle,
	) => void;
}

export function WorkflowDesigner({
	defaultValue = generateInitialWorkflowData(),
}: {
	defaultValue?: WorkflowData;
}): WorkflowDesignerOperations {
	const nodes = defaultValue.nodes;
	const connections = defaultValue.connections;
	function addTextGenerationNode(
		params: z.infer<typeof CreateTextGenerationNodeParams>,
	) {
		const textgenerationNodeData = createTextGenerationNodeData(params);
		nodes.set(textgenerationNodeData.id, textgenerationNodeData);
	}
	function addTextNode(params: z.infer<typeof CreateTextNodeParams>) {
		const textNodeData = createTextNodeData(params);
		nodes.set(textNodeData.id, textNodeData);
	}
	function getData() {
		return {
			id: defaultValue.id,
			nodes,
			connections,
		};
	}
	function updateNodeData(nodeId: NodeId, data: NodeData) {
		nodes.set(nodeId, data);
	}
	function addConnection(
		sourceNode: BaseNodeData,
		targetNodeHandle: ConnectionHandle,
	) {
		const connection = createConnection({
			sourceNode,
			targetNodeHandle,
		});
		connections.set(connection.id, connection);
	}

	return {
		addTextGenerationNode,
		addTextNode,
		addConnection,
		getData,
		updateNodeData,
	};
}
