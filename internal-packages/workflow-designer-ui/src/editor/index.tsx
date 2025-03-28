"use client";

import { InputId, OutputId } from "@giselle-sdk/data-type";
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
import { useEffect, useMemo, useRef } from "react";
import {
	type ImperativePanelHandle,
	Panel,
	PanelGroup,
	PanelResizeHandle,
} from "react-resizable-panels";
import { Background } from "../ui/background";
import { ToastProvider, useToasts } from "../ui/toast";
import { edgeTypes } from "./connector";
import { type ConnectorType, GradientDef } from "./connector/component";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { type GiselleWorkflowDesignerNode, nodeTypes } from "./node";
import { PropertiesPanel } from "./properties-panel";
import {
	FloatingNodePreview,
	MousePositionProvider,
	Toolbar,
	ToolbarContextProvider,
	useToolbar,
} from "./tool";

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
	const { error: errorToast } = useToasts();
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

	const handleConnect = (connection: Connection) => {
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
			const newInput = {
				id: InputId.generate(),
				label: "Input",
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
		} catch (error: unknown) {
			if (error instanceof Error) {
				errorToast(error.message);
			} else {
				errorToast("Failed to connect nodes");
			}
		}
	};

	const handleEdgesDelete = (edgesToDelete: Edge[]) => {
		for (const edge of edgesToDelete) {
			const connection = data.connections.find((conn) => conn.id === edge.id);
			if (!connection) {
				continue;
			}

			deleteConnection(connection.id);
			const targetNode = data.nodes.find(
				(node) => node.id === connection.inputNode.id,
			);
			if (targetNode && targetNode.type === "action") {
				const updatedInputs = targetNode.inputs.filter(
					(input) => input.id !== connection.inputId,
				);
				updateNodeData(targetNode, {
					inputs: updatedInputs,
				});
			}
		}
	};

	const isValidConnection: IsValidConnection<ConnectorType> = (
		connection: Connection | ConnectorType,
	) => {
		const { source, target, sourceHandle, targetHandle } = connection;
		if (!sourceHandle || !targetHandle) {
			return false;
		}
		if (source === target) {
			return false;
		}

		const outputNode = data.nodes.find((node) => node.id === connection.source);
		const inputNode = data.nodes.find((node) => node.id === connection.target);
		if (!outputNode || !inputNode) {
			return false;
		}
		const isAlreadyConnected = data.connections.some(
			(conn) =>
				conn.inputNode.id === inputNode.id &&
				conn.outputNode.id === outputNode.id,
		);
		if (isAlreadyConnected) {
			return false;
		}

		return true;
	};

	return (
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
			onNodeDoubleClick={(_event, nodeDoubleClicked) => {
				for (const node of data.nodes) {
					if (node.id === nodeDoubleClicked.id) {
						setUiNodeState(node.id, { selected: true });
					} else {
						setUiNodeState(node.id, { selected: false });
					}
				}
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
					setUiNodeState(node.id, { position: node.position }, { save: true });
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
	);
}

export function Editor() {
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
	return (
		<div className="flex-1 overflow-hidden font-sans">
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
										{/* <Debug /> */}
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
		</div>
	);
}
