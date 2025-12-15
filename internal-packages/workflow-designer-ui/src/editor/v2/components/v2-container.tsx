"use client";

import {
	InputId,
	isActionNode,
	isAppEntryNode,
	isEndNode,
	type NodeId,
	OutputId,
} from "@giselles-ai/protocol";
import {
	type Connection,
	type Edge,
	type IsValidConnection,
	type NodeMouseHandler,
	type OnEdgesChange,
	type OnNodesChange,
	ReactFlow,
	type Node as RFNode,
	useNodesInitialized,
	useReactFlow,
	useUpdateNodeInternals,
	Panel as XYFlowPanel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useToasts } from "@giselle-internal/ui/toast";
import {
	createConnectionWithInput,
	isSupportedConnection,
	useWorkflowDesigner,
	useWorkflowDesignerStore,
	workspaceActions,
} from "@giselles-ai/react";
import clsx from "clsx/lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useShallow } from "zustand/shallow";
import { Background } from "../../../ui/background";
import { edgeTypes } from "../../connector";
import { GradientDef } from "../../connector/component";
import { ContextMenu } from "../../context-menu";
import type { ContextMenuProps } from "../../context-menu/types";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { nodeTypes } from "../../node";
import { PropertiesPanel } from "../../properties-panel";
import { RunHistoryTable } from "../../run-history/run-history-table";
import { SecretTable } from "../../secret/secret-table";
import { FloatingNodePreview, Toolbar, useToolbar } from "../../tool";
import type { V2LayoutState } from "../state";
import { FloatingPropertiesPanel } from "./floating-properties-panel";
import { LeftPanel } from "./left-panel";

interface V2ContainerProps extends V2LayoutState {
	onLeftPanelClose: () => void;
}

function DebugWorkspacePanel() {
	const [isEnabled, setIsEnabled] = useState(false);

	useEffect(() => {
		if (process.env.NODE_ENV === "production") return;
		const params = new URLSearchParams(window.location.search);
		setIsEnabled(params.get("debugPanel") === "1");
	}, []);

	const debug = useWorkflowDesignerStore(
		useShallow((s) => ({
			hasStartNode: s.hasStartNode(),
			hasEndNode: s.hasEndNode(),
			isStartNodeConnectedToEndNode: s.isStartNodeConnectedToEndNode(),
			nodeCount: s.workspace.nodes.length,
			connectionCount: s.workspace.connections.length,
			// IMPORTANT: keep snapshot stable (no new arrays/objects) to avoid
			// "The result of getSnapshot should be cached..." warning.
			startNodeIdsText: s.workspace.nodes
				.filter((node) => isAppEntryNode(node))
				.map((node) => node.id)
				.join(", "),
			endNodeIdsText: s.workspace.nodes
				.filter((node) => isEndNode(node))
				.map((node) => node.id)
				.join(", "),
		})),
	);

	if (!isEnabled) return null;

	return (
		<XYFlowPanel position="top-right">
			<div className="rounded-md border border-border bg-bg/80 backdrop-blur px-3 py-2 text-xs">
				<div className="font-semibold">Debug</div>
				<div className="mt-1 grid grid-cols-[auto,1fr] gap-x-3 gap-y-1">
					<div className="text-muted-foreground">hasStartNode</div>
					<div>{String(debug.hasStartNode)}</div>
					<div className="text-muted-foreground">hasEndNode</div>
					<div>{String(debug.hasEndNode)}</div>
					<div className="text-muted-foreground">connected</div>
					<div>{String(debug.isStartNodeConnectedToEndNode)}</div>
					<div className="text-muted-foreground">nodes</div>
					<div>{debug.nodeCount}</div>
					<div className="text-muted-foreground">connections</div>
					<div>{debug.connectionCount}</div>
				</div>

				<details className="mt-2">
					<summary className="cursor-pointer select-none text-muted-foreground">
						IDs
					</summary>
					<div className="mt-1 space-y-1">
						<div>
							<span className="text-muted-foreground">start:</span>{" "}
							{debug.startNodeIdsText || "-"}
						</div>
						<div>
							<span className="text-muted-foreground">end:</span>{" "}
							{debug.endNodeIdsText || "-"}
						</div>
					</div>
				</details>
			</div>
		</XYFlowPanel>
	);
}

function V2NodeCanvas() {
	const data = useWorkflowDesignerStore(
		useShallow((s) => ({
			nodes: s.workspace.nodes,
			connections: s.workspace.connections,
			nodeState: s.workspace.ui.nodeState,
			viewport: s.workspace.ui.viewport,
			selectedConnectionIds: s.workspace.ui.selectedConnectionIds,
		})),
	);
	const nodeIds = useWorkflowDesignerStore(
		useShallow((s) => s.workspace.nodes.map((node) => node.id)),
	);
	const {
		setUiNodeState,
		setUiViewport,
		setCurrentShortcutScope,
		deleteConnection,
		updateNodeData,
		addNode,
		addConnection,
		selectConnection,
		deselectConnection,
	} = useWorkflowDesignerStore(useShallow(workspaceActions));
	const { deleteNode } = useWorkflowDesigner();
	const { selectedTool, reset } = useToolbar();
	const toast = useToasts();
	const [menu, setMenu] = useState<Omit<ContextMenuProps, "onClose"> | null>(
		null,
	);
	const reactFlowRef = useRef<HTMLDivElement>(null);
	const didInitialAutoFitViewRef = useRef(false);

	const reactFlowInstance = useReactFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	const { handleKeyDown } = useKeyboardShortcuts();
	const nodesInitialized = useNodesInitialized();

	const cacheNodesRef = useRef<Map<NodeId, RFNode>>(new Map());
	const nodes = useMemo(() => {
		const next = new Map<NodeId, RFNode>();
		const arr = data.nodes
			.map((node) => {
				const nodeUiState = data.nodeState[node.id];
				const prev = cacheNodesRef.current.get(node.id);
				if (nodeUiState === undefined) {
					return null;
				}
				if (
					prev !== undefined &&
					prev.selected === nodeUiState.selected &&
					prev.position.x === nodeUiState.position.x &&
					prev.position.y === nodeUiState.position.y &&
					prev.measured?.width === nodeUiState.measured?.width &&
					prev.measured?.height === nodeUiState.measured?.height
				) {
					next.set(node.id, prev);
					return prev;
				}
				const nextNode: RFNode = {
					id: node.id,
					type: "giselle",
					position: nodeUiState.position,
					selected: nodeUiState.selected,
					measured: nodeUiState.measured,
					data: {},
				};
				updateNodeInternals(node.id);
				next.set(node.id, nextNode);
				return nextNode;
			})
			.filter((node) => node !== null);
		cacheNodesRef.current = next;
		return arr;
	}, [data.nodes, data.nodeState, updateNodeInternals]);

	useEffect(() => {
		if (didInitialAutoFitViewRef.current) {
			return;
		}
		if (!nodesInitialized) {
			return;
		}

		const pane = reactFlowRef.current?.getBoundingClientRect();
		if (!pane) {
			return;
		}

		const internalNodes = reactFlowInstance.getNodes();
		if (internalNodes.length === 0) {
			didInitialAutoFitViewRef.current = true;
			return;
		}

		const topLeft = reactFlowInstance.screenToFlowPosition({
			x: pane.left,
			y: pane.top,
		});
		const bottomRight = reactFlowInstance.screenToFlowPosition({
			x: pane.right,
			y: pane.bottom,
		});

		const viewportRect = {
			minX: Math.min(topLeft.x, bottomRight.x),
			minY: Math.min(topLeft.y, bottomRight.y),
			maxX: Math.max(topLeft.x, bottomRight.x),
			maxY: Math.max(topLeft.y, bottomRight.y),
		};

		const isAnyNodeVisible = internalNodes.some((node) => {
			const position = node.position;
			const width = node.measured?.width ?? node.width ?? 0;
			const height = node.measured?.height ?? node.height ?? 0;

			if (width <= 0 || height <= 0) {
				return false;
			}

			const nodeRect = {
				minX: position.x,
				minY: position.y,
				maxX: position.x + width,
				maxY: position.y + height,
			};

			return (
				nodeRect.minX <= viewportRect.maxX &&
				nodeRect.maxX >= viewportRect.minX &&
				nodeRect.minY <= viewportRect.maxY &&
				nodeRect.maxY >= viewportRect.minY
			);
		});

		if (!isAnyNodeVisible) {
			reactFlowInstance.fitView({ padding: 0.2 });
		}

		didInitialAutoFitViewRef.current = true;
	}, [nodesInitialized, reactFlowInstance]);

	const cacheEdgesRef = useRef<Map<string, Edge>>(new Map());
	const edges = useMemo(() => {
		const next = new Map<string, Edge>();
		const arr = data.connections.map((connection) => {
			const prev = cacheEdgesRef.current.get(connection.id);
			const selected = data.selectedConnectionIds.includes(connection.id);
			if (prev !== undefined && selected === prev.selected) {
				return prev;
			}
			const nextEdge: Edge = {
				id: connection.id,
				source: connection.outputNode.id,
				sourceHandle: connection.outputId,
				target: connection.inputNode.id,
				targetHandle: connection.inputId,
				type: "giselleConnector",
				selected,
				data: { connection },
			};
			next.set(connection.id, nextEdge);
			return nextEdge;
		});
		cacheEdgesRef.current = next;
		return arr;
	}, [data.connections, data.selectedConnectionIds]);

	const handleConnect = useCallback(
		(connection: Connection) => {
			try {
				const outputNode = data.nodes.find(
					(node) => node.id === connection.source,
				);
				const inputNode = data.nodes.find(
					(node) => node.id === connection.target,
				);
				if (!outputNode || !inputNode) throw new Error("Node not found");

				const isSupported = isSupportedConnection(outputNode, inputNode);
				if (!isSupported.canConnect) throw new Error(isSupported.message);

				const safeOutputId = OutputId.safeParse(connection.sourceHandle);
				if (!safeOutputId.success) throw new Error("Invalid output id");
				const outputId = safeOutputId.data;

				const inputId = isActionNode(inputNode)
					? InputId.safeParse(connection.targetHandle).success
						? InputId.safeParse(connection.targetHandle).data
						: undefined
					: undefined;

				if (isActionNode(inputNode) && inputId === undefined) {
					throw new Error("Invalid input id");
				}

				createConnectionWithInput({
					outputNode,
					outputId,
					inputNode,
					inputId,
					updateNodeData,
					addConnection,
				});
			} catch (error: unknown) {
				toast.error(
					error instanceof Error ? error.message : "Failed to connect nodes",
				);
			}
		},
		[addConnection, data.nodes, toast, updateNodeData],
	);

	const isValidConnection: IsValidConnection = (connection) => {
		if (
			!connection.sourceHandle ||
			!connection.targetHandle ||
			connection.source === connection.target
		) {
			return false;
		}
		return !data.connections.some(
			(conn) =>
				conn.inputNode.id === connection.target &&
				conn.outputNode.id === connection.source &&
				(conn.inputId === connection.targetHandle ||
					conn.outputId === connection.sourceHandle),
		);
	};
	const handleNodeClick: NodeMouseHandler = useCallback(
		(_event, nodeClicked) => {
			for (const nodeId of nodeIds) {
				setUiNodeState(nodeId, { selected: nodeId === nodeClicked.id });
			}
			// Always maintain canvas focus when clicking nodes
			setCurrentShortcutScope("canvas");
		},
		[setCurrentShortcutScope, nodeIds, setUiNodeState],
	);

	const handleNodesChange: OnNodesChange = useCallback(
		async (nodesChange) => {
			await Promise.all(
				nodesChange.map(async (nodeChange) => {
					switch (nodeChange.type) {
						case "position": {
							if (nodeChange.position === undefined) {
								break;
							}
							setUiNodeState(nodeChange.id, { position: nodeChange.position });
							break;
						}
						case "dimensions": {
							setUiNodeState(nodeChange.id, {
								measured: {
									width: nodeChange.dimensions?.width,
									height: nodeChange.dimensions?.height,
								},
							});
							break;
						}
						case "select": {
							setUiNodeState(nodeChange.id, { selected: nodeChange.selected });
							break;
						}
						case "remove": {
							for (const connection of data.connections) {
								if (connection.outputNode.id !== nodeChange.id) {
									continue;
								}
								deleteConnection(connection.id);
								const connectedNode = data.nodes.find(
									(node) => node.id === connection.inputNode.id,
								);
								if (connectedNode === undefined) {
									continue;
								}
								switch (connectedNode.content.type) {
									case "textGeneration": {
										updateNodeData(connectedNode, {
											inputs: connectedNode.inputs.filter(
												(input) => input.id !== connection.inputId,
											),
										});
									}
								}
							}
							await deleteNode(nodeChange.id);
							break;
						}
					}
				}),
			);
		},
		[
			setUiNodeState,
			data.connections,
			data.nodes,
			deleteConnection,
			updateNodeData,
			deleteNode,
		],
	);

	const handleEdgesChange: OnEdgesChange = useCallback(
		(changes) => {
			for (const change of changes) {
				switch (change.type) {
					case "select":
						if (change.selected) {
							selectConnection(change.id);
						} else {
							deselectConnection(change.id);
						}
						break;
					case "remove": {
						deleteConnection(change.id);
						break;
					}
				}
			}
		},
		[selectConnection, deleteConnection, deselectConnection],
	);
	const handlePanelClick = useCallback(
		(e: React.MouseEvent) => {
			setMenu(null);
			for (const node of data.nodes) {
				setUiNodeState(node.id, { selected: false });
			}
			if (selectedTool?.action === "addNode") {
				const position = reactFlowInstance.screenToFlowPosition({
					x: e.clientX,
					y: e.clientY,
				});
				addNode(selectedTool.node, { position });
			}
			reset();
			// Set canvas focus when clicking on canvas
			setCurrentShortcutScope("canvas");
			// setSelectedConnectionIds([]);
		},
		[
			data.nodes,
			setUiNodeState,
			reactFlowInstance,
			selectedTool,
			addNode,
			reset,
			setCurrentShortcutScope,
		],
	);
	const handleNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
		event.preventDefault();
		const pane = reactFlowRef.current?.getBoundingClientRect();
		if (!pane) return;
		setMenu({
			id: node.id,
			top: event.clientY < pane.height - 200 ? event.clientY : undefined,
			left: event.clientX < pane.width - 200 ? event.clientX : undefined,
			right:
				event.clientX >= pane.width - 200
					? pane.width - event.clientX
					: undefined,
			bottom:
				event.clientY >= pane.height - 200
					? pane.height - event.clientY
					: undefined,
		});
	}, []);

	return (
		<ReactFlow
			ref={reactFlowRef}
			className="giselle-workflow-editor-v3"
			colorMode="dark"
			nodes={nodes}
			edges={edges}
			nodeTypes={nodeTypes}
			edgeTypes={edgeTypes}
			defaultViewport={data.viewport}
			onConnect={handleConnect}
			isValidConnection={isValidConnection}
			panOnScroll={true}
			zoomOnScroll={false}
			zoomOnPinch={true}
			tabIndex={0}
			onMoveEnd={(_, viewport) => setUiViewport(viewport)}
			onNodesChange={handleNodesChange}
			onNodeClick={handleNodeClick}
			onPaneClick={handlePanelClick}
			onKeyDown={handleKeyDown}
			onNodeContextMenu={handleNodeContextMenu}
			onEdgesChange={handleEdgesChange}
		>
			<Background />
			<DebugWorkspacePanel />
			{selectedTool?.action === "addNode" && (
				<FloatingNodePreview node={selectedTool.node} />
			)}
			<XYFlowPanel position="bottom-center">
				<Toolbar />
			</XYFlowPanel>
			{menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
		</ReactFlow>
	);
}

export function V2Container({ leftPanel, onLeftPanelClose }: V2ContainerProps) {
	const selectedNodes = useWorkflowDesignerStore(
		useShallow((s) =>
			s.workspace.nodes.filter(
				(node) => s.workspace.ui.nodeState[node.id]?.selected,
			),
		),
	);

	const isPropertiesPanelOpen = selectedNodes.length === 1;
	const isTextGenerationPanel =
		isPropertiesPanelOpen &&
		`${selectedNodes[0]?.content.type}` === "textGeneration";
	const isFilePanel =
		isPropertiesPanelOpen && `${selectedNodes[0]?.content.type}` === "file";
	const isTextPanel =
		isPropertiesPanelOpen && `${selectedNodes[0]?.content.type}` === "text";
	const isVectorStorePanel =
		isPropertiesPanelOpen &&
		`${selectedNodes[0]?.content.type}` === "vectorStore";
	const isWebPagePanel =
		isPropertiesPanelOpen && `${selectedNodes[0]?.content.type}` === "webPage";
	const isManualTriggerPanel =
		isPropertiesPanelOpen &&
		`${selectedNodes[0]?.content.type}` === "trigger" &&
		`${(selectedNodes[0] as unknown as { content?: { provider?: string } })?.content?.provider}` ===
			"manual";

	const mainRef = useRef<HTMLDivElement>(null);

	return (
		<main className="relative flex-1 bg-bg overflow-hidden" ref={mainRef}>
			<PanelGroup direction="horizontal" className="h-full flex">
				{leftPanel !== null && (
					<>
						<Panel order={1}>
							{leftPanel === "run-history" && (
								<LeftPanel onClose={onLeftPanelClose} title="Run History">
									<RunHistoryTable />
								</LeftPanel>
							)}
							{leftPanel === "secret" && (
								<LeftPanel onClose={onLeftPanelClose} title="Secrets">
									<SecretTable />
								</LeftPanel>
							)}
						</Panel>
						<PanelResizeHandle
							className={clsx(
								"w-[12px] cursor-col-resize group flex items-center justify-center",
							)}
						>
							<div
								className={clsx(
									"w-[3px] h-[32px] rounded-full transition-colors",
									"bg-[#6b7280] opacity-60",
									"group-data-[resize-handle-state=hover]:bg-[#4a90e2]",
									"group-data-[resize-handle-state=drag]:bg-[#4a90e2]",
								)}
							/>
						</PanelResizeHandle>
					</>
				)}

				<Panel order={2}>
					{/* Main Content Area */}
					<V2NodeCanvas />
					{/* Floating Properties Panel */}
					<FloatingPropertiesPanel
						isOpen={isPropertiesPanelOpen}
						container={mainRef.current}
						title="Properties Panel"
						defaultWidth={isTextGenerationPanel ? 400 : undefined}
						minWidth={isTextGenerationPanel ? 400 : undefined}
						autoHeight={
							isFilePanel ||
							isTextPanel ||
							isVectorStorePanel ||
							isWebPagePanel ||
							isManualTriggerPanel
						}
					>
						<PropertiesPanel />
					</FloatingPropertiesPanel>
				</Panel>
			</PanelGroup>
			<GradientDef />
		</main>
	);
}
