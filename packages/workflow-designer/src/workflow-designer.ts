import {
	ConnectionId,
	type InputId,
	type Node,
	type NodeBase,
	NodeId,
	type NodeLike,
	type NodeReference,
	NodeUIState,
	type OutputId,
	type Viewport,
	type Workspace,
	generateInitialWorkspace,
} from "@giselle-sdk/data-type";
import { nodeFactories } from "@giselle-sdk/node-utils";
import { buildWorkflowMap } from "@giselle-sdk/workflow-utils";
import { isSupportedConnection } from "./is-supported-connection";

interface AddNodeOptions {
	ui?: NodeUIState;
}

export type ConnectionCloneStrategy =
	| "inputs-only" // Default: Only incoming connections to the new node are cloned
	| "all" // Clones both incoming and outgoing connections
	| "none"; // Clones no connections (future possibility)
// Add more strategies here as needed, e.g., "outputs-only"
const DEFAULT_CONNECTION_CLONE_STRATEGY: ConnectionCloneStrategy =
	"inputs-only";

export type WorkflowDesigner = ReturnType<typeof WorkflowDesigner>;

export function WorkflowDesigner({
	defaultValue = generateInitialWorkspace(),
}: {
	defaultValue?: Workspace;
}) {
	let nodes = defaultValue.nodes;
	let connections = defaultValue.connections;
	const ui = defaultValue.ui;
	let editingWorkflows = defaultValue.editingWorkflows;
	let name = defaultValue.name;
	function updateWorkflowMap() {
		editingWorkflows = Array.from(
			buildWorkflowMap(
				new Map(nodes.map((node) => [node.id, node])),
				new Map(connections.map((connection) => [connection.id, connection])),
			).values(),
		);
	}
	function addNode(node: Node, options?: AddNodeOptions) {
		nodes = [...nodes, node];
		if (options?.ui) {
			ui.nodeState[node.id] = options.ui;
		}
		updateWorkflowMap();
	}
	function copyNode(
		sourceNode: Node,
		options?: {
			connectionCloneStrategy?: ConnectionCloneStrategy;
		} & AddNodeOptions,
	): Node | undefined {
		const { newNode, inputIdMap, outputIdMap } =
			nodeFactories.clone(sourceNode);
		addNode(newNode, options);

		const strategy =
			options?.connectionCloneStrategy ?? DEFAULT_CONNECTION_CLONE_STRATEGY;

		// Find connections related to the original sourceNode
		const originalConnections = connections.filter(
			(conn) =>
				conn.inputNode.id === sourceNode.id ||
				conn.outputNode.id === sourceNode.id,
		);

		for (const originalConnection of originalConnections) {
			// Case 1: Source node was the INPUT node of the original connection
			// (originalConnection.outputNode) ---> (sourceNode)
			// We want to clone this to: (originalConnection.outputNode) ---> (newNode)
			if (
				originalConnection.inputNode.id === sourceNode.id &&
				(strategy === "all" || strategy === "inputs-only")
			) {
				const outputNode = nodes.find(
					(n) => n.id === originalConnection.outputNode.id,
				);
				if (outputNode) {
					const newInputId = inputIdMap[originalConnection.inputId];
					if (newInputId) {
						addConnection({
							outputNode: outputNode, // Keep original output node
							outputId: originalConnection.outputId,
							inputNode: newNode, // New cloned node is the input
							inputId: newInputId, // Use the new input ID from the map
						});
					} else {
						console.warn(
							`Could not find new input ID for old input ID: ${originalConnection.inputId} on new node ${newNode.id}`,
						);
					}
				}
			}
			// Case 2: Source node was the OUTPUT node of the original connection
			// (sourceNode) ---> (originalConnection.inputNode)
			// We want to clone this to: (newNode) ---> (originalConnection.inputNode)
			// This should only happen if strategy is "all"
			else if (
				originalConnection.outputNode.id === sourceNode.id &&
				strategy === "all"
			) {
				const inputNode = nodes.find(
					(n) => n.id === originalConnection.inputNode.id,
				);
				if (inputNode) {
					const newOutputId = outputIdMap[originalConnection.outputId];
					if (newOutputId) {
						addConnection({
							outputNode: newNode, // New cloned node is the output
							outputId: newOutputId, // Use the new output ID from the map
							inputNode: inputNode, // Keep original input node
							inputId: originalConnection.inputId,
						});
					} else {
						console.warn(
							`Could not find new output ID for old output ID: ${originalConnection.outputId} on new node ${newNode.id}`,
						);
					}
				}
			}
		}

		return newNode;
	}
	function getData() {
		return {
			id: defaultValue.id,
			nodes,
			connections,
			name,
			ui,
			editingWorkflows,
			schemaVersion: "20250221",
		} satisfies Workspace;
	}
	function updateNodeData<T extends NodeBase>(node: T, data: Partial<T>) {
		nodes = nodes.map((n) => (n.id !== node.id ? n : { ...n, ...data }));
		updateWorkflowMap();
	}
	function addConnection({
		outputId,
		outputNode,
		inputId,
		inputNode,
	}: {
		outputNode: NodeLike;
		outputId: OutputId;
		inputNode: NodeLike;
		inputId: InputId;
	}) {
		connections = [
			...connections,
			{
				id: ConnectionId.generate(),
				outputNode: {
					id: outputNode.id,
					type: outputNode.type,
					content: { type: outputNode.content.type },
				} as NodeReference,
				outputId,
				inputNode: {
					id: inputNode.id,
					type: inputNode.type,
					content: { type: inputNode.content.type },
				} as NodeReference,
				inputId,
			},
		];
		updateWorkflowMap();
	}
	function setUiNodeState(
		unsafeNodeId: string | NodeId,
		newUiState: Partial<NodeUIState>,
	): void {
		const inputNodeId = NodeId.parse(unsafeNodeId);
		const nodeState = ui.nodeState[inputNodeId];
		ui.nodeState[inputNodeId] = NodeUIState.parse({
			...nodeState,
			...newUiState,
		});
	}
	function setUiViewport(viewport: Viewport) {
		ui.viewport = viewport;
	}
	function deleteConnection(connectionId: ConnectionId) {
		connections = connections.filter(
			(connection) => connection.id !== connectionId,
		);
	}
	function deleteNode(unsafeNodeId: string | NodeId) {
		const deleteNodeId = NodeId.parse(unsafeNodeId);
		const deleteNode = nodes.find((node) => node.id === deleteNodeId);
		delete ui.nodeState[deleteNodeId];
		nodes = nodes.filter((node) => node.id !== deleteNodeId);
		updateWorkflowMap();
		return deleteNode;
	}
	function updateName(newName: string | undefined) {
		name = newName;
	}

	return {
		addNode,
		copyNode,
		addConnection,
		getData,
		updateNodeData,
		setUiNodeState,
		setUiViewport,
		deleteNode,
		deleteConnection,
		updateName,
		isSupportedConnection,
	};
}
