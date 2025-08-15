"use client";

import {
	InputId,
	isActionNode,
	isOperationNode,
	OutputId,
} from "@giselle-sdk/data-type";
import {
	type Connection,
	type Edge,
	type IsValidConnection,
	ReactFlow,
	useReactFlow,
	useUpdateNodeInternals,
	Panel as XYFlowPanel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useToasts } from "@giselle-internal/ui/toast";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import clsx from "clsx/lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Background } from "../../../ui/background";
import { edgeTypes } from "../../connector";
import { type ConnectorType, GradientDef } from "../../connector/component";
import { ContextMenu } from "../../context-menu";
import type { ContextMenuProps } from "../../context-menu/types";
import { DataSourceTable } from "../../data-source";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { type GiselleWorkflowDesignerNode, nodeTypes } from "../../node";
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
	const {
		data,
		setUiNodeState,
		setUiViewport,
		setUiFocusedArea,
		deleteNode,
		deleteConnection,
		updateNodeData,
		addNode,
		addConnection,
		isSupportedConnection,
	} = useWorkflowDesigner();
	const reactFlowInstance = useReactFlow<
		GiselleWorkflowDesignerNode,
		ConnectorType
	>();
	const updateNodeInternals = useUpdateNodeInternals();
	const { selectedTool, reset } = useToolbar();
	const toast = useToasts();
	const [menu, setMenu] = useState<Omit<ContextMenuProps, "onClose"> | null>(
		null,
	);
	const reactFlowRef = useRef<HTMLDivElement>(null);

	const { handleKeyDown } = useKeyboardShortcuts();

	useEffect(() => {
		reactFlowInstance.setNodes(
			Object.entries(data.ui.nodeState)
				.map(([nodeId, nodeState]) => {
					const nodeData = data.nodes.find((node) => node.id === nodeId);
					if (nodeData === undefined || nodeState === undefined) return null;
					return {
						id: nodeId,
						type: nodeData.content.type,
						position: { x: nodeState.position.x, y: nodeState.position.y },
						selected: nodeState.selected,
						data: { nodeData },
					} as GiselleWorkflowDesignerNode;
				})
				.filter((result) => result !== null),
		);
		updateNodeInternals(Object.keys(data.ui.nodeState));
	}, [data, reactFlowInstance.setNodes, updateNodeInternals]);

	useEffect(() => {
		reactFlowInstance.setEdges(
			data.connections.map((connection) => ({
				id: connection.id,
				type: "giselleConnector",
				source: connection.outputNode.id,
				sourceHandle: connection.outputId,
				target: connection.inputNode.id,
				targetHandle: connection.inputId,
				data: { connection },
			})),
		);
	}, [data, reactFlowInstance.setEdges]);

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
		[addConnection, data.nodes, toast, isSupportedConnection, updateNodeData],
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

	const isValidConnection: IsValidConnection<ConnectorType> = (connection) => {
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

	return (
		<ReactFlow<GiselleWorkflowDesignerNode, ConnectorType>
			ref={reactFlowRef}
			className="giselle-workflow-editor-v3"
			colorMode="dark"
			defaultNodes={[]}
			defaultEdges={[]}
			nodeTypes={nodeTypes}
			edgeTypes={edgeTypes}
			defaultViewport={data.ui.viewport}
			onConnect={handleConnect}
			onEdgesDelete={handleEdgesDelete}
			isValidConnection={isValidConnection}
			panOnScroll={true}
			zoomOnScroll={false}
			zoomOnPinch={true}
			onMoveEnd={(_, viewport) => setUiViewport(viewport)}
			onNodesChange={async (nodesChange) => {
				await Promise.all(
					nodesChange.map(async (nodeChange) => {
						switch (nodeChange.type) {
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
			}}
			onNodeClick={(_, nodeClicked) => {
				for (const node of data.nodes) {
					setUiNodeState(node.id, { selected: node.id === nodeClicked.id });
				}
				// Always maintain canvas focus when clicking nodes
				setUiFocusedArea("canvas");
			}}
			onNodeDragStop={(_, __, nodes) => {
				for (const node of nodes) {
					setUiNodeState(node.id, { position: node.position }, { save: true });
				}
			}}
			onPaneClick={(event) => {
				setMenu(null);
				for (const node of data.nodes) {
					setUiNodeState(node.id, { selected: false });
				}
				const position = reactFlowInstance.screenToFlowPosition({
					x: event.clientX,
					y: event.clientY,
				});
				if (selectedTool?.action === "addNode") {
					addNode(selectedTool.node, { ui: { position } });
				}
				reset();
				// Set canvas focus when clicking on canvas
				setUiFocusedArea("canvas");
			}}
			onKeyDown={handleKeyDown}
			tabIndex={0}
			onNodeContextMenu={(event, node) => {
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
			}}
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
	const { data } = useWorkflowDesigner();
	const selectedNodes = useMemo(
		() =>
			Object.entries(data.ui.nodeState)
				.filter(([_, nodeState]) => nodeState?.selected)
				.map(([nodeId]) => data.nodes.find((node) => node.id === nodeId))
				.filter((node) => node !== undefined),
		[data],
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
