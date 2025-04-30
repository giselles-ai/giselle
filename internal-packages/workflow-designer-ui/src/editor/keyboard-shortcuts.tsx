import { useWorkflowDesigner } from "giselle-sdk/react";
import { useCallback, useEffect } from "react";
import {
	moveTool,
	selectFileNodeCategoryTool,
	selectLanguageModelTool,
	selectSourceCategoryTool,
	useToolbar,
} from "./tool/toolbar";

const ignoredTags = ["INPUT", "TEXTAREA", "SELECT"];

export function KeyboardShortcuts() {
	const { setSelectedTool } = useToolbar();
	const { data, copyNode } = useWorkflowDesigner();

	const handleDuplicate = useCallback(() => {
		const selectedNode = data.nodes.find(
			(node) => data.ui.nodeState[node.id]?.selected,
		);

		if (!selectedNode) return;

		const nodeState = data.ui.nodeState[selectedNode.id];
		if (!nodeState) return;

		const position = {
			x: nodeState.position.x + 200,
			y: nodeState.position.y + 100,
		};

		copyNode(selectedNode, { ui: { position } });
	}, [data.nodes, data.ui.nodeState, copyNode]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const activeElement = document.activeElement;

			if (
				ignoredTags.includes(activeElement?.tagName ?? "") ||
				activeElement?.getAttribute("contenteditable") === "true"
			) {
				return;
			}

			if ((event.metaKey || event.ctrlKey) && event.key === "d") {
				event.preventDefault();
				handleDuplicate();
				return;
			}

			switch (event.key) {
				case "g":
					setSelectedTool(selectLanguageModelTool());
					break;
				case "s":
					setSelectedTool(selectSourceCategoryTool());
					break;
				case "u":
					setSelectedTool(selectFileNodeCategoryTool());
					break;
			}
			if (event.code === "Escape") {
				setSelectedTool(moveTool());
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [setSelectedTool, handleDuplicate]);

	return <></>;
}
