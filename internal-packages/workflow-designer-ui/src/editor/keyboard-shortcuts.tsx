import { useEffect } from "react";
import {
	moveTool,
	selectFileNodeCategoryTool,
	selectLanguageModelTool,
	selectRetrievalCategoryTool,
	selectSourceCategoryTool,
	useToolbar,
} from "./tool/toolbar";

const ignoredTags = ["INPUT", "TEXTAREA", "SELECT"];

export function KeyboardShortcuts() {
	const { setSelectedTool } = useToolbar();

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const activeElement = document.activeElement;

			if (
				ignoredTags.includes(activeElement?.tagName ?? "") ||
				activeElement?.getAttribute("contenteditable") === "true"
			) {
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
				case "r":
					setSelectedTool(selectRetrievalCategoryTool());
					break;
			}
			if (event.code === "Escape") {
				setSelectedTool(moveTool());
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [setSelectedTool]);

	return <></>;
}
