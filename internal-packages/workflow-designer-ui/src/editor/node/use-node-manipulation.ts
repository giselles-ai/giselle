import { useCallback } from "react";
import {
	useCopyNodeToClipboard,
	useDuplicateNode,
	usePasteNodeFromClipboard,
} from "../../app-designer";

export function useNodeManipulation() {
	const copyNodeToClipboard = useCopyNodeToClipboard();
	const pasteNodeFromClipboard = usePasteNodeFromClipboard();
	const duplicateNode = useDuplicateNode();

	const copy = useCallback(
		(onError?: () => void) => {
			copyNodeToClipboard({ onError });
		},
		[copyNodeToClipboard],
	);

	const paste = useCallback(
		(onError?: () => void) => {
			pasteNodeFromClipboard({ onError });
		},
		[pasteNodeFromClipboard],
	);

	const duplicate = useCallback(
		(nodeId?: string, onError?: () => void) => {
			duplicateNode({ nodeId, onError });
		},
		[duplicateNode],
	);

	return {
		copy,
		paste,
		duplicate,
	};
}
