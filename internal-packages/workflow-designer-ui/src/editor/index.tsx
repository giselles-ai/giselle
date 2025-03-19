"use client";

import {
	ReactFlow,
	ReactFlowProvider,
	Panel as XYFlowPanel,
	useReactFlow,
	useUpdateNodeInternals,
} from "@xyflow/react";
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
import "@xyflow/react/dist/style.css";
import { OutputId } from "@giselle-sdk/data-type";
import { Background } from "../ui/background";
import { ToastProvider } from "../ui/toast";
import { edgeTypes } from "./connector";
import { type ConnectorType, GradientDef } from "./connector/component";

function NodeCanvas() {
	const {
		data,
		setUiNodeState,
		setUiViewport,
		deleteNode,
		deleteConnection,
		updateNodeData,
		addNode,
	} = useWorkflowDesigner();
	const reactFlowInstance = useReactFlow<
		GiselleWorkflowDesignerNode,
		ConnectorType
	>();
	const updateNodeInternals = useUpdateNodeInternals();
	const { selectedTool, reset } = useToolbar();
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
	return (
		<ReactFlow<GiselleWorkflowDesignerNode, ConnectorType>
			className="giselle-workflow-editor"
			colorMode="dark"
			defaultNodes={[]}
			defaultEdges={[]}
			nodeTypes={nodeTypes}
			edgeTypes={edgeTypes}
			defaultViewport={data.ui.viewport}
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
								<Panel className="flex-1 px-[16px] pb-[16px]" defaultSize={100}>
									<div className="flex h-full rounded-[16px] overflow-hidden">
										{/* <Debug /> */}
										<NodeCanvas />
									</div>
								</Panel>

								<PanelResizeHandle
									className={clsx(
										"w-[1px] bg-black-400/50 transition-colors",
										"data-[resize-handle-state=hover]:bg-black-400 data-[resize-handle-state=drag]:bg-black-400",
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
