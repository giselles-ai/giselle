"use client";

import { InputId, OutputId, isActionNode } from "@giselle-sdk/data-type";
import {
	type Connection,
	type Edge,
	type IsValidConnection,
	ReactFlow,
	ReactFlowProvider,
	Panel as XYFlowPanel,
	useReactFlow,
	useUpdateNodeInternals,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import clsx from "clsx/lite";
import { useWorkflowDesigner } from "giselle-sdk/react";
import { useAnimationFrame, useSpring } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	type ImperativePanelHandle,
	Panel,
	PanelGroup,
	PanelResizeHandle,
} from "react-resizable-panels";
import { Background } from "../ui/background";
import { ReadOnlyBanner } from "../ui/read-only-banner";
import { ToastProvider, useToasts } from "../ui/toast";
import { Beta } from "./beta";
import { edgeTypes } from "./connector";
import { type ConnectorType, GradientDef } from "./connector/component";
import { ContextMenu, useContextMenu } from "./context-menu";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { useDuplicateNode } from "./node";
import { type GiselleWorkflowDesignerNode, nodeTypes } from "./node";
import { PropertiesPanel } from "./properties-panel";
import {
	FloatingNodePreview,
	MousePositionProvider,
	Toolbar,
	ToolbarContextProvider,
	useToolbar,
} from "./tool";
import { WorkspaceTour, tourSteps } from "./workspace-tour";

function NodeCanvas() {
	const {
		data,
		setUiNodeState,
		setUiViewport,
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
	const { contextMenu, setContextMenu, closeContextMenu } = useContextMenu();
	const duplicateNode = useDuplicateNode();
	useEffect(() => {
		reactFlowInstance.setNodes(
			Object.entries(data.ui.nodeState)
				.map(([nodeId, nodeState]) => {
					const nodeData = data.nodes.find((node) => node.id === nodeId);
					if (nodeData === undefined || nodeState === undefined) {
						return null;
					}
					return {
						id: nodeId,
						type: nodeData.content.type,
						position: { x: nodeState.position.x, y: nodeState.position.y },
						selected: nodeState.selected,
						data: { nodeData: nodeData },
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
				data: {
					connection,
				},
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
				if (!outputNode || !inputNode) {
					throw new Error("Node not found");
				}

				const isSupported = isSupportedConnection(outputNode, inputNode);
				if (!isSupported.canConnect) {
					throw new Error(isSupported.message);
				}

				const safeOutputId = OutputId.safeParse(connection.sourceHandle);
				if (!safeOutputId.success) {
					throw new Error("Invalid output id");
				}
				const outputId = safeOutputId.data;
				if (isActionNode(inputNode)) {
					const safeInputId = InputId.safeParse(connection.targetHandle);
					if (!safeInputId.success) {
						throw new Error("Invalid input id");
					}
					const inputId = safeInputId.data;
					addConnection({
						inputNode,
						inputId,
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
					const updatedInputs = [...inputNode.inputs, newInput];
					updateNodeData(inputNode, {
						inputs: updatedInputs,
					});
					addConnection({
						inputNode: inputNode,
						inputId: newInput.id,
						outputId,
						outputNode: outputNode,
					});
				}
			} catch (error: unknown) {
				if (error instanceof Error) {
					toast.error(error.message);
				} else {
					toast.error("Failed to connect nodes");
				}
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
					targetNode.type === "operation" &&
					targetNode.content.type !== "action"
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
		if (!connection.sourceHandle || !connection.targetHandle) {
			return false;
		}
		if (connection.source === connection.target) {
			return false;
		}

		const connectedInputIds: string[] = [];
		const connectedOutputIds: string[] = [];
		for (const connectedConnection of data.connections) {
			if (
				connectedConnection.inputNode.id !== connection.target ||
				connectedConnection.outputNode.id !== connection.source
			) {
				continue;
			}
			if (connectedConnection.inputId === connection.targetHandle) {
				connectedInputIds.push(connectedConnection.inputId);
			}
			if (connectedConnection.outputId === connection.sourceHandle) {
				connectedOutputIds.push(connectedConnection.outputId);
			}
		}
		if (connectedInputIds.includes(connection.targetHandle)) {
			return false;
		}
		if (connectedOutputIds.includes(connection.sourceHandle)) {
			return false;
		}

		return true;
	};

	return (
		<>
			<ReactFlow<GiselleWorkflowDesignerNode, ConnectorType>
				className="giselle-workflow-editor"
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
				onMoveEnd={(_, viewport) => {
					setUiViewport(viewport);
				}}
				onNodesChange={(nodesChange) => {
					nodesChange.map((nodeChange) => {
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
								deleteNode(nodeChange.id);
								break;
							}
						}
					});
				}}
				onNodeClick={(_event, nodeClicked) => {
					for (const node of data.nodes) {
						if (node.id === nodeClicked.id) {
							setUiNodeState(node.id, { selected: true });
						} else {
							setUiNodeState(node.id, { selected: false });
						}
					}
				}}
				onNodeDoubleClick={(_event, nodeDoubleClicked) => {
					const viewport = reactFlowInstance.getViewport();
					const screenPosition = reactFlowInstance.flowToScreenPosition(
						nodeDoubleClicked.position,
					);
					reactFlowInstance.setViewport(
						{
							...viewport,
							x: viewport.x - screenPosition.x + 100,
						},
						{
							duration: 300,
						},
					);
				}}
				onNodeDragStop={(_event, _node, nodes) => {
					nodes.map((node) => {
						setUiNodeState(
							node.id,
							{ position: node.position },
							{ save: true },
						);
					});
				}}
				onPaneClick={(event) => {
					for (const node of data.nodes) {
						setUiNodeState(node.id, { selected: false });
					}
					const position = reactFlowInstance.screenToFlowPosition({
						x: event.clientX,
						y: event.clientY,
					});
					const options = {
						ui: { position },
					};
					if (selectedTool?.action === "addNode") {
						addNode(selectedTool.node, options);
					}
					reset();
					closeContextMenu();
				}}
				onNodeContextMenu={(event, node) => {
					event.preventDefault();
					setContextMenu({
						x: event.clientX,
						y: event.clientY,
						nodeId: node.id,
					});
				}}
			>
				<Background />
				{selectedTool?.action === "addNode" && (
					<FloatingNodePreview node={selectedTool.node} />
				)}
				<XYFlowPanel position={"bottom-center"}>
					<Toolbar />
				</XYFlowPanel>
			</ReactFlow>
			<ContextMenu
				contextMenu={contextMenu}
				onDuplicate={(nodeId) => {
					duplicateNode(nodeId, () =>
						toast.error("No node selected to duplicate"),
					);
					closeContextMenu();
				}}
				onClose={closeContextMenu}
			/>
		</>
	);
}

export function Editor({
	githubTools = false,
	isReadOnly = false,
	userRole = "viewer",
}: {
	githubTools?: boolean;
	isReadOnly?: boolean;
	userRole?: "viewer" | "guest" | "editor" | "owner";
}) {
	const { data } = useWorkflowDesigner();
	const selectedNodes = useMemo(
		() =>
			Object.entries(data.ui.nodeState)
				.filter(([_, nodeState]) => nodeState?.selected)
				.map(([nodeId]) => data.nodes.find((node) => node.id === nodeId))
				.filter((node) => node !== undefined),
		[data],
	);
	const rightPanelRef = useRef<ImperativePanelHandle>(null);
	const rightPanelWidthMotionValue = useSpring(0, {
		stiffness: 500,
		damping: 50,
		mass: 1,
	});
	const expand = useRef(false);
	const collapse = useRef(false);

	const [showReadOnlyBanner, setShowReadOnlyBanner] = useState(isReadOnly);

	useEffect(() => {
		if (!rightPanelRef.current) {
			return;
		}
		if (selectedNodes.length === 1) {
			expand.current = true;
			rightPanelWidthMotionValue.set(50);
			rightPanelRef.current.resize(50);
		} else {
			collapse.current = true;
			rightPanelWidthMotionValue.set(0);
			rightPanelRef.current.resize(0);
		}
	}, [selectedNodes.length, rightPanelWidthMotionValue]);

	useAnimationFrame(() => {
		if (!rightPanelRef.current) {
			return;
		}
		const rightPanelWidth = rightPanelWidthMotionValue.get();
		if (expand.current) {
			rightPanelRef.current.resize(rightPanelWidth);
			if (rightPanelWidth === 50) {
				expand.current = false;
				collapse.current = false;
			}
		} else if (collapse.current) {
			rightPanelRef.current.resize(rightPanelWidth);
			if (rightPanelWidth === 0) {
				expand.current = false;
				collapse.current = false;
			}
		} else {
			rightPanelWidthMotionValue.jump(rightPanelRef.current.getSize());
		}
	});

	const [isTourOpen, setIsTourOpen] = useState(data.nodes.length === 0);

	const handleDismissBanner = useCallback(() => {
		setShowReadOnlyBanner(false);
	}, []);

	return (
		<div className="flex-1 overflow-hidden font-sans">
			{showReadOnlyBanner && isReadOnly && (
				<ReadOnlyBanner
					onDismiss={handleDismissBanner}
					userRole={userRole}
					className="z-50"
				/>
			)}

			<Beta.Provider value={{ githubTools }}>
				<ToastProvider>
					<ReactFlowProvider>
						<ToolbarContextProvider>
							<MousePositionProvider>
								<PanelGroup
									direction="horizontal"
									className="bg-black-900 h-full flex"
								>
									<Panel
										className="flex-1 px-[16px] pb-[16px] pr-0"
										defaultSize={100}
									>
										<div className="h-full flex">
											<NodeCanvas />
										</div>
									</Panel>

									<PanelResizeHandle
										className={clsx(
											"w-[12px] flex items-center justify-center cursor-col-resize",
											"after:content-[''] after:w-[3px] after:h-[32px] after:bg-[#3a3f44] after:rounded-full",
											"hover:after:bg-[#4a90e2]",
										)}
									/>
									<Panel
										id="right-panel"
										className="flex py-[16px]"
										ref={rightPanelRef}
										defaultSize={0}
									>
										{selectedNodes.length === 1 && (
											<div className="flex-1 overflow-hidden">
												<PropertiesPanel />
											</div>
										)}
									</Panel>
								</PanelGroup>
								<KeyboardShortcuts />
							</MousePositionProvider>
						</ToolbarContextProvider>
						<GradientDef />
					</ReactFlowProvider>
				</ToastProvider>
				<WorkspaceTour
					steps={tourSteps}
					isOpen={isTourOpen}
					onOpenChange={setIsTourOpen}
				/>
			</Beta.Provider>
		</div>
	);
}
