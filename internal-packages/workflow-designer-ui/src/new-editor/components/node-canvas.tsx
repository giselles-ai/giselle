"use client";

import type { NodeId } from "@giselles-ai/protocol";
import {
	type NodeMouseHandler,
	type OnNodesChange,
	ReactFlow,
	type Node as RFNode,
} from "@xyflow/react";
import { memo, useCallback, useMemo, useRef } from "react";
import { shallow } from "zustand/shallow";
import { Background } from "../../ui/background";
import { isNodeId } from "../lib/is-node-id";
import { logger } from "../lib/logger";
import { selectCanvasData } from "../lib/selectors";
import { useEditorStore, useEditorStoreWithEqualityFn } from "../store/context";
import { Node } from "./node";

export function NodeCanvas() {
	// Subscribe to node UI data and edges in a single selector
	const { nodeUiData, edges } = useEditorStoreWithEqualityFn(
		selectCanvasData,
		shallow,
	);

	// Preserve RFNode object identity for unchanged items.
	const cacheRef = useRef<Map<NodeId, RFNode>>(new Map());
	const nodes = useMemo(() => {
		const next = new Map<NodeId, RFNode>();
		const arr = nodeUiData
			.map(({ id, position, selected }) => {
				if (!isNodeId(id)) {
					return null;
				}
				const prev = cacheRef.current.get(id);
				if (
					prev &&
					prev.selected === selected &&
					prev.position.x === position.x &&
					prev.position.y === position.y
				) {
					next.set(id, prev);
					return prev;
				}
				const node: RFNode = {
					id,
					type: "custom",
					position,
					selected,
					data: prev?.data ?? {},
				};
				next.set(id, node);
				return node;
			})
			.filter((node) => node !== null);
		cacheRef.current = next;
		return arr;
	}, [nodeUiData]);
	const setNodePosition = useEditorStore((s) => s.setNodePosition);
	const setNodeSelected = useEditorStore((s) => s.setNodeSelected);
	const setInspectedNodeId = useEditorStore((s) => s.setInspectedNodeId);
	const nodeTypes = useMemo(
		() => ({
			custom: memo(Node),
		}),
		[],
	);

	const onNodesChange = useCallback<OnNodesChange>(
		(changes) => {
			for (const change of changes) {
				switch (change.type) {
					case "position": {
						if (isNodeId(change.id) && change.position) {
							setNodePosition(change.id, change.position);
						}
						break;
					}
					case "select": {
						if (isNodeId(change.id)) {
							setNodeSelected(change.id, !!change.selected);
						}
						break;
					}
					case "remove": {
						/** @todo */
						logger.trace(change, "Removing node");
						break;
					}
					default:
						break;
				}
			}
		},
		[setNodePosition, setNodeSelected],
	);

	const onNodeClick = useCallback<NodeMouseHandler>(
		(_event, node) => {
			if (isNodeId(node.id)) {
				setInspectedNodeId(node.id);
			}
		},
		[setInspectedNodeId],
	);

	const onPaneClick = useCallback(() => {
		setInspectedNodeId(undefined);
	}, [setInspectedNodeId]);

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			nodeTypes={nodeTypes}
			className="flex-1"
			onNodeClick={onNodeClick}
			onPaneClick={onPaneClick}
		>
			<Background />
		</ReactFlow>
	);
}
