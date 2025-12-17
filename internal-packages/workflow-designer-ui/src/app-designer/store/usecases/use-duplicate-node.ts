import { isFileNode, Node } from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useAppDesignerStoreApi } from "../app-designer-provider";
import { useAppDesignerStore, useWorkspaceActions } from "../hooks";
import { useCopyFiles } from "./use-copy-files";
import { useCopyNode } from "./use-copy-node";

const OFFSET_X = 200;
const OFFSET_Y = 100;
const SINGLE_INSTANCE_NODE_TYPES = new Set(["appEntry", "end"]);

function isSingleInstanceNode(node: Node) {
	return SINGLE_INSTANCE_NODE_TYPES.has(node.content.type);
}

export function useDuplicateNode() {
	const store = useAppDesignerStoreApi();
	const nodes = useAppDesignerStore((s) => s.nodes);
	const { setUiNodeState } = useWorkspaceActions((s) => ({
		setUiNodeState: s.setUiNodeState,
	}));
	const copyNode = useCopyNode();
	const copyFiles = useCopyFiles();

	return useCallback(
		(args?: { nodeId?: string; onError?: () => void }) => {
			const state = store.getState();
			const targetNodeLike = args?.nodeId
				? state.nodes.find((n) => n.id === args.nodeId)
				: state.nodes.find((n) => state.ui.nodeState[n.id]?.selected);
			if (!targetNodeLike) {
				args?.onError?.();
				return;
			}

			try {
				const targetNode = Node.parse(targetNodeLike);
				if (
					isSingleInstanceNode(targetNode) &&
					nodes.some((n) => n.content.type === targetNode.content.type)
				) {
					args?.onError?.();
					return;
				}
				const nodeState = state.ui.nodeState[targetNode.id];
				if (!nodeState) {
					args?.onError?.();
					return;
				}
				const position = {
					x: nodeState.position.x + OFFSET_X,
					y: nodeState.position.y + OFFSET_Y,
				};
				const newNode = copyNode(targetNode, {
					ui: { position, selected: nodeState.selected },
				});
				setUiNodeState(targetNode.id, { selected: false });

				if (newNode && isFileNode(newNode)) {
					const hasPendingCopy = newNode.content.files.some(
						(f) => f.status === "pending-copy",
					);
					if (hasPendingCopy) {
						copyFiles(newNode);
					}
				}
			} catch {
				args?.onError?.();
			}
		},
		[copyFiles, copyNode, nodes, setUiNodeState, store],
	);
}
