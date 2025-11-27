import { defaultName } from "@giselles-ai/node-registry";
import {
	type ContentGenerationNode,
	InputId,
	type NodeId,
	type NodeLike,
	type OutputId,
} from "@giselles-ai/protocol";
import {
	type UIConnection,
	useWorkflowDesigner,
	useWorkflowDesignerStore,
} from "@giselles-ai/react";
import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/shallow";

export function useNodeContext(node: ContentGenerationNode) {
	const { nodes, connections: allConnections } = useWorkflowDesignerStore(
		useShallow((s) => ({
			connections: s.workspace.connections,
			nodes: s.workspace.nodes,
		})),
	);

	const connections = useMemo(() => {
		const connectedConnections = allConnections.filter(
			(connection) => connection.inputNode.id === node.id,
		);

		const uiConnections: UIConnection[] = [];
		for (const connection of connectedConnections) {
			const outputNode = nodes.find((n) => n.id === connection.outputNode.id);
			if (outputNode === undefined) {
				continue;
			}
			const output = outputNode.outputs.find(
				(output) => output.id === connection.outputId,
			);
			if (output === undefined) {
				continue;
			}
			const inputNode = nodes.find((n) => n.id === connection.inputNode.id);
			if (inputNode === undefined) {
				continue;
			}
			const input = inputNode.inputs.find(
				(input) => input.id === connection.inputId,
			);
			if (input === undefined) {
				continue;
			}
			uiConnections.push({
				id: connection.id,
				output,
				outputNode,
				input,
				inputNode,
			});
		}
		return uiConnections;
	}, [allConnections, node.id, nodes]);

	const shouldShowOutputLabel = useCallback(
		(nodeId: NodeId) => {
			const countMap = new Map<string, number>();
			for (const connection of connections) {
				const currentCount = countMap.get(connection.outputNode.id) ?? 0;
				countMap.set(connection.outputNode.id, currentCount + 1);
			}
			return (countMap.get(nodeId) ?? 0) > 1;
		},
		[connections],
	);

	const { data, addConnection, isSupportedConnection, updateNodeData } =
		useWorkflowDesigner();

	// Get available nodes that can be connected as context
	const availableContextNodes = useMemo(() => {
		const groups: Array<{
			groupId: string;
			groupLabel: string;
			items: Array<{ value: string; label: string }>;
		}> = [];

		const textGeneratorNodes: Array<{
			outputNode: NodeLike;
			outputId: OutputId;
			label: string;
		}> = [];
		const textNodes: Array<{
			outputNode: NodeLike;
			outputId: OutputId;
			label: string;
		}> = [];
		const fileNodes: Array<{
			outputNode: NodeLike;
			outputId: OutputId;
			label: string;
		}> = [];
		const actionNodes: Array<{
			outputNode: NodeLike;
			outputId: OutputId;
			label: string;
		}> = [];
		const triggerNodes: Array<{
			outputNode: NodeLike;
			outputId: OutputId;
			label: string;
		}> = [];
		const queryNodes: Array<{
			outputNode: NodeLike;
			outputId: OutputId;
			label: string;
		}> = [];
		const otherNodes: Array<{
			outputNode: NodeLike;
			outputId: OutputId;
			label: string;
		}> = [];

		for (const currentNode of data.nodes) {
			if (currentNode.id === node.id) {
				continue;
			}

			// Check if this node can connect to our content generation node
			const { canConnect } = isSupportedConnection(currentNode, node);
			if (!canConnect) {
				continue;
			}

			for (const output of currentNode.outputs) {
				// Skip if this output is already connected
				const isAlreadyConnected = connections.some(
					(conn) =>
						conn.outputNode.id === currentNode.id &&
						conn.output.id === output.id,
				);
				if (isAlreadyConnected) {
					continue;
				}

				const nodeName = defaultName(currentNode);
				const label =
					currentNode.outputs.length > 1
						? `${nodeName}:${output.label}`
						: nodeName;
				const item = {
					outputNode: currentNode,
					outputId: output.id,
					label,
				};

				// Categorize by node type
				if (currentNode.type === "operation") {
					switch (currentNode.content.type) {
						case "textGeneration":
						case "contentGeneration":
							textGeneratorNodes.push(item);
							break;
						case "action":
							actionNodes.push(item);
							break;
						case "trigger":
							triggerNodes.push(item);
							break;
						case "query":
							queryNodes.push(item);
							break;
						default:
							otherNodes.push(item);
							break;
					}
				} else if (currentNode.type === "variable") {
					switch (currentNode.content.type) {
						case "text":
							textNodes.push(item);
							break;
						case "file":
							fileNodes.push(item);
							break;
						default:
							otherNodes.push(item);
							break;
					}
				} else {
					otherNodes.push(item);
				}
			}
		}

		if (textGeneratorNodes.length > 0) {
			groups.push({
				groupId: "textGenerator",
				groupLabel: "Text Generator",
				items: textGeneratorNodes.map((item) => ({
					value: `${item.outputNode.id}:${item.outputId}`,
					label: item.label,
				})),
			});
		}
		if (actionNodes.length > 0) {
			groups.push({
				groupId: "action",
				groupLabel: "Action",
				items: actionNodes.map((item) => ({
					value: `${item.outputNode.id}:${item.outputId}`,
					label: item.label,
				})),
			});
		}
		if (triggerNodes.length > 0) {
			groups.push({
				groupId: "trigger",
				groupLabel: "Trigger",
				items: triggerNodes.map((item) => ({
					value: `${item.outputNode.id}:${item.outputId}`,
					label: item.label,
				})),
			});
		}
		if (queryNodes.length > 0) {
			groups.push({
				groupId: "query",
				groupLabel: "Query",
				items: queryNodes.map((item) => ({
					value: `${item.outputNode.id}:${item.outputId}`,
					label: item.label,
				})),
			});
		}
		if (textNodes.length > 0) {
			groups.push({
				groupId: "text",
				groupLabel: "Text",
				items: textNodes.map((item) => ({
					value: `${item.outputNode.id}:${item.outputId}`,
					label: item.label,
				})),
			});
		}
		if (fileNodes.length > 0) {
			groups.push({
				groupId: "file",
				groupLabel: "File",
				items: fileNodes.map((item) => ({
					value: `${item.outputNode.id}:${item.outputId}`,
					label: item.label,
				})),
			});
		}
		if (otherNodes.length > 0) {
			groups.push({
				groupId: "other",
				groupLabel: "Other",
				items: otherNodes.map((item) => ({
					value: `${item.outputNode.id}:${item.outputId}`,
					label: item.label,
				})),
			});
		}
		return groups;
	}, [data.nodes, node, isSupportedConnection, connections]);

	const handleContextSelect = useCallback(
		(_e: unknown, item: { value: string; label: string }) => {
			const [nodeId, outputId] = item.value.split(":");
			const outputNode = data.nodes.find((n) => n.id === nodeId);
			if (!outputNode || !outputId) {
				return;
			}
			const newInputId = InputId.generate();
			const newInput = {
				id: newInputId,
				label: "Input",
				accessor: newInputId,
			};
			updateNodeData(node, {
				inputs: [...node.inputs, newInput],
			});
			addConnection({
				outputNode,
				outputId: outputId as OutputId,
				inputNode: node,
				inputId: newInput.id,
			});
		},
		[node, addConnection, updateNodeData, data.nodes],
	);

	return {
		shouldShowOutputLabel,
		connections,
		availableContextNodes,
		handleContextSelect,
	};
}
