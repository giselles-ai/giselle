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
	let name = defaultValue.name;
	function addNode(node: Node, options?: AddNodeOptions) {
		nodes = [...nodes, node];
		if (options?.ui) {
			ui.nodeState[node.id] = options.ui;
		}
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
						// Check if connection already exists
						const connectionExists = connections.some(
							(conn) =>
								conn.outputNode.id === outputNode.id &&
								conn.outputId === originalConnection.outputId &&
								conn.inputNode.id === newNode.id &&
								conn.inputId === newInputId,
						);

						// Check if connection is valid
						const connectionValid = isSupportedConnection(
							outputNode,
							newNode,
						).canConnect;

						if (!connectionExists && connectionValid) {
							addConnection({
								outputNode: outputNode,
								outputId: originalConnection.outputId,
								inputNode: newNode,
								inputId: newInputId,
							});
						}
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
						// Check if connection already exists
						const connectionExists = connections.some(
							(conn) =>
								conn.outputNode.id === newNode.id &&
								conn.outputId === newOutputId &&
								conn.inputNode.id === inputNode.id &&
								conn.inputId === originalConnection.inputId,
						);

						// Check if connection is valid
						const connectionValid = isSupportedConnection(
							newNode,
							inputNode,
						).canConnect;

						if (!connectionExists && connectionValid) {
							addConnection({
								outputNode: newNode,
								outputId: newOutputId,
								inputNode: inputNode,
								inputId: originalConnection.inputId,
							});
						}
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
			schemaVersion: "20250221",
		} satisfies Workspace;
	}
	function updateNodeData<T extends NodeBase>(node: T, data: Partial<T>) {
		nodes = nodes.map((n) => (n.id !== node.id ? n : { ...n, ...data }));
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
