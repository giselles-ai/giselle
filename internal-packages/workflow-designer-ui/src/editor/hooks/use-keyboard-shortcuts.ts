import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { useKeyPress } from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
import { useNodeManipulation } from "../node";
import {
	moveTool,
	selectActionTool,
	selectLanguageModelTool,
	selectRetrievalCategoryTool,
	selectSourceCategoryTool,
	selectTriggerTool,
	useToolbar,
} from "../tool/toolbar";
import type { Tool } from "../tool/types";

// Browser shortcuts that should be prevented when canvas is focused
const BROWSER_SHORTCUTS_TO_PREVENT = [
	{ key: "d", modifiers: ["meta", "ctrl"] }, // Bookmark
	// Add more shortcuts here as needed:
	// { key: 's', modifiers: ['meta', 'ctrl'] }, // Save page
	// { key: 'p', modifiers: ['meta', 'ctrl'] }, // Print
];

// Custom hook for handling key actions with repeat prevention
function useKeyAction(
	key: string | string[],
	action: () => void,
	enabled: boolean = false,
) {
	const wasPressed = useRef(false);
	const isPressed = useKeyPress(key, { actInsideInputWithModifier: false });

	useEffect(() => {
		if (isPressed && !wasPressed.current && enabled) {
			action();
		}
		wasPressed.current = isPressed;
	}, [isPressed, enabled, action]);
}

function useToolAction(key: string, toolFunction: () => Tool) {
	const toolbar = useToolbar();
	const { data } = useWorkflowDesigner();
	const isCanvasFocused = data.ui.focusedArea === "canvas";
	const canUseToolShortcuts = isCanvasFocused && !!toolbar;

	useKeyAction(
		key,
		() => toolbar?.setSelectedTool(toolFunction()),
		canUseToolShortcuts,
	);
}

export function useKeyboardShortcuts() {
	const { data } = useWorkflowDesigner();
	const {
		copy: handleCopy,
		paste: handlePaste,
		duplicate: handleDuplicate,
	} = useNodeManipulation();

	const isCanvasFocused = data.ui.focusedArea === "canvas";

	// Tool shortcuts using the simplified hook
	useToolAction("t", selectTriggerTool);
	useToolAction("i", selectSourceCategoryTool);
	useToolAction("g", selectLanguageModelTool);
	useToolAction("r", selectRetrievalCategoryTool);
	useToolAction("d", selectActionTool);
	useToolAction("Escape", moveTool);

	// Copy/Paste/Duplicate shortcuts
	useKeyAction(["Meta+c", "Control+c"], handleCopy, isCanvasFocused);
	useKeyAction(["Meta+v", "Control+v"], handlePaste, isCanvasFocused);
	useKeyAction(["Meta+d", "Control+d"], handleDuplicate, isCanvasFocused);

	// Return handler for preventing browser default shortcuts
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			if (!isCanvasFocused) return;

			const shouldPrevent = BROWSER_SHORTCUTS_TO_PREVENT.some((shortcut) => {
				const keyMatches = event.key.toLowerCase() === shortcut.key;
				const modifierMatches = shortcut.modifiers.some((mod) => {
					if (mod === "meta") return event.metaKey;
					if (mod === "ctrl") return event.ctrlKey;
					return false;
				});
				return keyMatches && modifierMatches;
			});

			if (shouldPrevent) {
				event.preventDefault();
			}
		},
		[isCanvasFocused],
	);

	return { handleKeyDown };
}
