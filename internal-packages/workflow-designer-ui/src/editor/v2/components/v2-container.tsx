"use client";

import {
	InputId,
	isActionNode,
	isOperationNode,
	type NodeId,
	OutputId,
} from "@giselle-sdk/data-type";
import {
	type Connection,
	type Edge,
	type IsValidConnection,
	type NodeMouseHandler,
	type OnNodesChange,
	ReactFlow,
	type Node as RFNode,
	useReactFlow,
	useUpdateNodeInternals,
	Panel as XYFlowPanel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useToasts } from "@giselle-internal/ui/toast";
import {
	isSupportedConnection,
	useWorkflowDesignerStore,
} from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { useCallback, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useShallow } from "zustand/shallow";
import { Background } from "../../../ui/background";
import { edgeTypes } from "../../connector";
import { GradientDef } from "../../connector/component";
import { ContextMenu } from "../../context-menu";
import type { ContextMenuProps } from "../../context-menu/types";
import { DataSourceTable } from "../../data-source";
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

function V2NodeCanvas() {
	const data = useWorkflowDesignerStore(
		useShallow((s) => ({
			nodes: s.workspace.nodes,
			connections: s.workspace.connections,
			nodeState: s.workspace.ui.nodeState,
			viewport: s.workspace.ui.viewport,
		})),
	);
	const nodeIds = useWorkflowDesignerStore(
		useShallow((s) => s.workspace.nodes.map((node) => node.id)),
	);
	const {
		setUiNodeState,
		setUiViewport,
		setCurrentShortcutScope,
		deleteNode,
		deleteConnection,
		updateNodeData,
		addNode,
		addConnection,
	} = useWorkflowDesignerStore(
		useShallow((s) => ({
			setUiNodeState: s.setUiNodeState,
			setUiViewport: s.setUiViewport,
			setCurrentShortcutScope: s.setCurrentShortcutScope,
			deleteNode: s.deleteNode,
			deleteConnection: s.deleteConnection,
			updateNodeData: s.updateNodeData,
			addNode: s.addNode,
			addConnection: s.addConnection,
		})),
	);
	const { selectedTool, reset } = useToolbar();
	const toast = useToasts();
	const [menu, setMenu] = useState<Omit<ContextMenuProps, "onClose"> | null>(
		null,
	);
	const reactFlowRef = useRef<HTMLDivElement>(null);

	const reactFlowInstance = useReactFlow();
	const updateNodeInternals = useUpdateNodeInternals();
	const { handleKeyDown } = useKeyboardShortcuts();

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

	const cacheEdgesRef = useRef<Map<string, Edge>>(new Map());
	const edges = useMemo(() => {
		const next = new Map<string, Edge>();
		const arr = data.connections.map((connection) => {
			const prev = cacheEdgesRef.current.get(connection.id);
			if (prev !== undefined) {
				return prev;
			}
			const nextEdge: Edge = {
				id: connection.id,
				source: connection.outputNode.id,
				sourceHandle: connection.outputId,
				target: connection.inputNode.id,
				targetHandle: connection.inputId,
				type: "giselleConnector",
				data: { connection },
			};
			next.set(connection.id, nextEdge);
			return nextEdge;
		});
		cacheEdgesRef.current = next;
		return arr;
	}, [data.connections]);

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

				if (isActionNode(inputNode)) {
					const safeInputId = InputId.safeParse(connection.targetHandle);
					if (!safeInputId.success) throw new Error("Invalid input id");
					addConnection({
						inputNode,
						inputId: safeInputId.data,
						outputNode,
						outputId,
					});
				} else {
					const newInputId = InputId.generate();
					const newInput = {
						id: newInputId,
						label: "Input",
						accessor: newInputId,
					};
					updateNodeData(inputNode, {
						inputs: [...inputNode.inputs, newInput],
					});
					addConnection({
						inputNode,
						inputId: newInput.id,
						outputId,
						outputNode,
					});
				}
			} catch (error: unknown) {
				toast.error(
					error instanceof Error ? error.message : "Failed to connect nodes",
				);
			}
		},
		[addConnection, data.nodes, toast, updateNodeData],
	);

	const handleEdgesDelete = useCallback(
		(edgesToDelete: Edge[]) => {
			for (const edge of edgesToDelete) {
				const connection = data.connections.find((conn) => conn.id === edge.id);
				if (!connection) {
					continue;
				}

				deleteConnection(connection.id);
				const targetNode = data.nodes.find(
					(node) => node.id === connection.inputNode.id,
				);
				if (
					targetNode &&
					isOperationNode(targetNode) &&
					!isActionNode(targetNode)
				) {
					const updatedInputs = targetNode.inputs.filter(
						(input) => input.id !== connection.inputId,
					);
					updateNodeData(targetNode, {
						inputs: updatedInputs,
					});
				}
			}
		},
		[data.nodes, data.connections, deleteConnection, updateNodeData],
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
		(nodesChange) => {
			nodesChange.map((nodeChange) => {
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
						deleteNode(nodeChange.id);
						break;
					}
				}
			});
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
			onEdgesDelete={handleEdgesDelete}
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
		>
			<Background />
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

	const mainRef = useRef<HTMLDivElement>(null);

	return (
		<main
			className="relative flex-1 bg-black-900 overflow-hidden"
			ref={mainRef}
		>
			<PanelGroup direction="horizontal" className="h-full flex">
				{leftPanel !== null && (
					<>
						<Panel order={1}>
							{leftPanel === "data-source" && (
								<LeftPanel onClose={onLeftPanelClose} title="Data Source">
									<DataSourceTable />
								</LeftPanel>
							)}
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
					>
						<PropertiesPanel />
					</FloatingPropertiesPanel>
				</Panel>
			</PanelGroup>
			<GradientDef />
		</main>
	);
}
