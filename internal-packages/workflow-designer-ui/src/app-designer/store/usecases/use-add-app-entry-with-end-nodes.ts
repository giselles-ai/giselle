import { createEndNode } from "@giselles-ai/node-registry";
import {
	isAppEntryNode,
	isEndNode,
	type NodeLike,
	type NodeUIState,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useAddNode } from "./use-add-node";

const DEFAULT_END_SPACING_X = 120;
const DEFAULT_END_OFFSET_Y = 0;
const DEFAULT_CARD_WIDTH = 180;
const DEFAULT_PILL_WIDTH = 220;

export interface AddAppEntryWithEndNodesParams {
	appEntryNode: NodeLike;
	position: { x: number; y: number };
	/**
	 * Optional placement tweak.
	 * - x: additional spacing to the right of the right-most existing node
	 * - y: vertical offset from the AppEntry's y
	 */
	endOffset?: { x: number; y: number };
}

function estimateNodeWidth(node: NodeLike, ui: NodeUIState | undefined) {
	const measuredWidth = ui?.measured?.width;
	if (typeof measuredWidth === "number" && measuredWidth > 0) {
		return measuredWidth;
	}
	return node.content.type === "appEntry" || node.content.type === "end"
		? DEFAULT_PILL_WIDTH
		: DEFAULT_CARD_WIDTH;
}

function computeRightMostEdgeX(
	nodes: NodeLike[],
	nodeState: Record<string, NodeUIState | undefined>,
) {
	let rightMost = -Infinity;
	for (const node of nodes) {
		const ui = nodeState[node.id];
		if (!ui) continue;
		const width = estimateNodeWidth(node, ui);
		rightMost = Math.max(rightMost, ui.position.x + width);
	}
	return rightMost;
}

/**
 * Adds an AppEntry node and an End node as a pair.
 *
 * This is intentionally a dedicated usecase (instead of branching inside `useAddNode`)
 * to avoid surprising other flows (copy/paste/duplicate) that also rely on `useAddNode`.
 */
export function useAddAppEntryWithEndNodes() {
	const store = useAppDesignerStoreApi();
	const addNode = useAddNode();

	return useCallback(
		({ appEntryNode, position, endOffset }: AddAppEntryWithEndNodesParams) => {
			if (!isAppEntryNode(appEntryNode)) {
				console.warn(
					"useAddAppEntryWithEndNodes called with non-AppEntry node",
				);
				return;
			}

			const state = store.getState();
			const existingAppEntry = state.nodes.find((n) => isAppEntryNode(n));
			const existingEnd = state.nodes.find((n) => isEndNode(n));

			// Be defensive: AppEntry/End are single-instance nodes. If they already exist,
			// don't create duplicates.
			if (existingAppEntry || existingEnd) {
				console.warn("AppEntry/End already exist; skipping paired add.");
				return;
			}

			const rightMostExistingEdgeX = computeRightMostEdgeX(
				state.nodes,
				state.ui.nodeState,
			);
			const appEntryRightEdgeX =
				position.x +
				estimateNodeWidth(appEntryNode, {
					position,
				});

			const endNode = createEndNode();
			const spacingX = endOffset?.x ?? DEFAULT_END_SPACING_X;
			const offsetY = endOffset?.y ?? DEFAULT_END_OFFSET_Y;

			addNode(appEntryNode, { position, selected: true });
			addNode(endNode, {
				position: {
					x: Math.max(rightMostExistingEdgeX, appEntryRightEdgeX) + spacingX,
					y: position.y + offsetY,
				},
				selected: false,
			});
		},
		[addNode, store],
	);
}
