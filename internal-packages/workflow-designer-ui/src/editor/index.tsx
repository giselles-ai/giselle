"use client";

import {
	Background,
	BackgroundVariant,
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
import bg from "../images/bg.png";
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
	const reactFlowInstance = useReactFlow();
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
					};
				})
				.filter((result) => result !== null),
		);
		updateNodeInternals(Object.keys(data.ui.nodeState));
	}, [data, reactFlowInstance.setNodes, updateNodeInternals]);
	useEffect(() => {
		reactFlowInstance.setEdges(
			data.connections.map((connection) => ({
				id: connection.id,
				source: connection.outputNodeId,
				sourceHandle: connection.outputId,
				target: connection.inputNodeId,
				targetHandle: connection.inputId,
			})),
		);
	}, [data, reactFlowInstance.setEdges]);
	return (
		<ReactFlow<GiselleWorkflowDesignerNode>
			className="giselle-workflow-editor"
			colorMode="dark"
			defaultNodes={[]}
			defaultEdges={[]}
			nodeTypes={nodeTypes}
			defaultViewport={data.ui.viewport}
			onMoveEnd={(_, viewport) => {
				setUiViewport(viewport);
			}}
			onNodesChange={(nodesChange) => {
				nodesChange.map((nodeChange) => {
					switch (nodeChange.type) {
						case "select": {
							setUiNodeState(nodeChange.id, { selected: nodeChange.selected });
							break;
						}
						case "remove": {
							for (const connection of data.connections) {
								if (connection.outputNodeId !== nodeChange.id) {
									continue;
								}
								deleteConnection(connection.id);
								const connectedNode = data.nodes.find(
									(node) => node.id === connection.inputNodeId,
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
			onNodeClick={(event, node) => {
				const viewport = reactFlowInstance.getViewport();
				const screenPosition = reactFlowInstance.flowToScreenPosition(
					node.position,
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
				event.preventDefault();
				const position = reactFlowInstance.screenToFlowPosition({
					x: event.clientX,
					y: event.clientY,
				});
				const options = {
					ui: { position },
				};
				switch (selectedTool?.action) {
					case "addTextNode":
						addNode(
							{
								name: "Text",
								type: "variable",
								content: {
									type: "text",
									text: "",
								},
								inputs: [],
								outputs: [
									{
										id: OutputId.generate(),
										label: "Output",
									},
								],
							},
							options,
						);
						break;
					case "addFileNode":
						if (selectedTool.fileCategory === undefined) {
							break;
						}
						switch (selectedTool.fileCategory) {
							case "pdf":
								addNode(
									{
										name: "PDF Files",
										type: "variable",
										content: {
											type: "file",
											category: "pdf",
											files: [],
										},
										inputs: [],
										outputs: [
											{
												id: OutputId.generate(),
												label: "Output",
											},
										],
									},
									options,
								);
								break;
							case "text":
								addNode(
									{
										name: "Text",
										type: "variable",
										content: {
											type: "text",
											text: "",
										},
										inputs: [],
										outputs: [
											{
												id: OutputId.generate(),
												label: "Output",
											},
										],
									},
									options,
								);

								break;
						}
						break;
					case "addTextGenerationNode":
						if (selectedTool.provider === undefined) {
							break;
						}
						switch (selectedTool.provider) {
							case "openai":
								addNode(
									{
										type: "action",
										content: {
											type: "textGeneration",
											llm: {
												provider: "openai",
												model: "gpt-4o",
												temperature: 0.7,
												topP: 1.0,
												presencePenalty: 0.0,
												frequencyPenalty: 0.0,
											},
										},
										inputs: [],
										outputs: [
											{
												id: OutputId.generate(),
												label: "Output",
											},
										],
									},
									options,
								);
								break;
							case "anthropic":
								addNode(
									{
										type: "action",
										content: {
											type: "textGeneration",
											llm: {
												provider: "anthropic",
												model: "claude-3-5-sonnet-latest",
												temperature: 0.7,
												topP: 1.0,
											},
										},
										inputs: [],
										outputs: [
											{
												id: OutputId.generate(),
												label: "Output",
											},
										],
									},
									options,
								);
								break;
							case "google":
								addNode(
									{
										type: "action",
										content: {
											type: "textGeneration",
											llm: {
												provider: "google",
												model: "gemini-1.5-flash-latest",
												temperature: 0.7,
												topP: 1.0,
												searchGrounding: false,
											},
										},
										inputs: [],
										outputs: [
											{
												id: OutputId.generate(),
												label: "Output",
											},
											{
												id: OutputId.generate(),
												label: "Search Result",
											},
										],
									},
									options,
								);
								break;
							default: {
								const _exhaustiveCheck: never = selectedTool.provider;
								throw new Error(`Unsupported provider: ${_exhaustiveCheck}`);
							}
						}
				}
				reset();
			}}
		>
			<Background
				className="!bg-black-800"
				lineWidth={0}
				variant={BackgroundVariant.Lines}
				style={{
					backgroundImage: `url(${bg.src})`,
					backgroundPositionX: "center",
					backgroundPositionY: "center",
					backgroundSize: "cover",
				}}
			/>
			{selectedTool?.category === "edit" && (
				<FloatingNodePreview tool={selectedTool} />
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
			</ReactFlowProvider>
		</div>
	);
}
