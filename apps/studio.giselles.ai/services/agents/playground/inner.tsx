"use client";

import { createId } from "@paralleldrive/cuid2";
import { Background, Panel, ReactFlow, useReactFlow } from "@xyflow/react";
import { type FC, useEffect } from "react";
import {
	Finder,
	GiselleNode,
	type Node,
	type Port,
	portDirection,
} from "../nodes";
import { useRequest } from "../requests/context";
import type { Request } from "../requests/types";
import { usePlayground } from "./context";
import { PropertyPanel } from "./property-panel";
import type { PlaygroundEdge, PlaygroundNode } from "./types";
import { useContextMenu } from "./use-context-menu";

const playgroundNodesToReactFlowNodes = (
	playgroundNodes: PlaygroundNode[],
	request?: Request | null | undefined,
) =>
	playgroundNodes.map(
		({ id, data, className, ports, position }) =>
			({
				id,
				type: "giselle",
				data: {
					...data,
					className: className,
					sourcePorts: ports.filter(
						(port) => port.direction === portDirection.source,
					),
					targetPorts: ports.filter(
						(port) => port.direction === portDirection.target,
					),
					stepStatus: request?.stacks
						.flatMap(
							(stack) =>
								stack.steps.find((step) => step.node.id === id)?.status,
						)
						.find((status) => status != null),
				},
				position,
			}) satisfies GiselleNode,
	);
const playgroundEdgesToReactFlowEdges = (playgroundEdges: PlaygroundEdge[]) =>
	playgroundEdges.map(
		({ id, sourceNodeId, sourcePortId, targetNodeId, targetPortId }) => ({
			id,
			source: sourceNodeId,
			sourceHandle: sourcePortId,
			target: targetNodeId,
			targetHandle: targetPortId,
		}),
	);

const nodeTypes = {
	giselle: GiselleNode,
};

export const Inner: FC = () => {
	const { isVisible, contextMenuPosition, hideContextMenu, handleContextMenu } =
		useContextMenu();
	const reactFlowInstance = useReactFlow<GiselleNode>();
	const { state, dispatch } = usePlayground();
	const {
		state: { request },
	} = useRequest();
	useEffect(() => {
		reactFlowInstance.setNodes((prevNodes) => {
			const newNodes = playgroundNodesToReactFlowNodes(
				state.graph.nodes,
				request,
			);
			return newNodes.map((newNode) => {
				const prevNode = prevNodes.find(({ id }) => id === newNode.id);
				return prevNode ? { ...prevNode, ...newNode } : newNode;
			});
		});
		reactFlowInstance.setEdges(
			playgroundEdgesToReactFlowEdges(state.graph.edges),
		);
	}, [
		reactFlowInstance.setNodes,
		reactFlowInstance.setEdges,
		state.graph,
		request,
	]);
	return (
		<ReactFlow
			onContextMenu={handleContextMenu}
			nodeTypes={nodeTypes}
			defaultNodes={playgroundNodesToReactFlowNodes(state.graph.nodes)}
			defaultEdges={playgroundEdgesToReactFlowEdges(state.graph.edges)}
			isValidConnection={({ source, sourceHandle, target, targetHandle }) => {
				const sourcePort = state.graph.nodes
					.find((node) => node.id === source)
					?.ports.find((port) => port.id === sourceHandle);
				const targetPort = state.graph.nodes
					.find((node) => node.id === target)
					?.ports.find((port) => port.id === targetHandle);
				if (sourcePort == null || targetPort == null) {
					return false;
				}
				return targetPort.type === sourcePort.type;
			}}
			onConnect={({ source, sourceHandle, target, targetHandle }) => {
				// Since validation is already performed by isValidConnection,
				// there is no need for additional validation here.
				dispatch({
					type: "ADD_EDGE",
					edge: {
						id: `ed_${createId()}`,
						sourceNodeId: source as Node["id"],
						sourcePortId: sourceHandle as Port["id"],
						targetNodeId: target as Node["id"],
						targetPortId: targetHandle as Port["id"],
					},
				});
			}}
			onEdgesDelete={(edges) => {
				edges.map((edge) => {
					dispatch({
						type: "REMOVE_EDGE",
						edgeId: edge.id,
					});
				});
			}}
			onNodeDragStop={(_event, _node, nodes) => {
				nodes.map((node) => {
					dispatch({
						type: "UPDATE_NODE",
						nodeId: node.id as Node["id"],
						updates: {
							position: node.position,
						},
					});
				});
			}}
			onNodesDelete={(nodes) => {
				nodes.map((node) => {
					dispatch({
						type: "REMOVE_NODE",
						nodeId: node.id as Node["id"],
					});
				});
			}}
			defaultViewport={state.graph.viewport}
			onViewportChange={(viewport) => {
				dispatch({
					type: "UPDATE_VIEWPORT",
					viewport,
				});
			}}
		>
			<Background />
			{isVisible && reactFlowInstance && (
				<Finder
					className="z-10 absolute"
					style={{
						left: contextMenuPosition.x,
						top: contextMenuPosition.y,
					}}
					onSelect={(node) => {
						hideContextMenu();
						dispatch({
							type: "ADD_NODE",
							node: {
								...node,
								position: reactFlowInstance.screenToFlowPosition({
									x: contextMenuPosition.x,
									y: contextMenuPosition.y,
								}),
							},
						});
					}}
				/>
			)}
			<Panel position="top-right" className="bottom-0">
				<div className="flex gap-2 h-full overflow-hidden">
					<PropertyPanel />
				</div>
			</Panel>
		</ReactFlow>
	);
};
