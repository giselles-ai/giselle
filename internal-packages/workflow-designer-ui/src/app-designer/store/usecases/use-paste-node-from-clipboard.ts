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

export function usePasteNodeFromClipboard() {
	const store = useAppDesignerStoreApi();
	const clipboardNode = useAppDesignerStore((s) => s.clipboardNode);
	const nodes = useAppDesignerStore((s) => s.nodes);
	const { setUiNodeState } = useWorkspaceActions((s) => ({
		setUiNodeState: s.setUiNodeState,
	}));
	const copyNode = useCopyNode();
	const copyFiles = useCopyFiles();

	return useCallback(
		(args?: { onError?: () => void }) => {
			if (!clipboardNode) {
				args?.onError?.();
				return;
			}

			const nodeState = store.getState().ui.nodeState[clipboardNode.id];
			if (!nodeState) {
				args?.onError?.();
				return;
			}

			try {
				const validatedNode = Node.parse(clipboardNode);
				if (
					isSingleInstanceNode(validatedNode) &&
					nodes.some((n) => n.content.type === validatedNode.content.type)
				) {
					args?.onError?.();
					return;
				}

				const position = {
					x: nodeState.position.x + OFFSET_X,
					y: nodeState.position.y + OFFSET_Y,
				};
				const newNode = copyNode(validatedNode, {
					ui: { position, selected: true },
				});
				setUiNodeState(validatedNode.id, { selected: false });

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
		[clipboardNode, copyFiles, copyNode, nodes, setUiNodeState, store],
	);
}
