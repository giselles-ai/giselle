import { useEffect } from "react";
import { useDuplicateNode } from "./node";
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
	const duplicateNode = useDuplicateNode();

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
				duplicateNode();
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
	}, [setSelectedTool, duplicateNode]);

	return <></>;
}
