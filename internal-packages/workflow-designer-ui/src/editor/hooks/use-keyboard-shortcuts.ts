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

type InputShortcutPolicy = "ignore" | "modifierOnly" | "always";

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
	options: {
		inputShortcutPolicy?: InputShortcutPolicy;
		preventDefault?: boolean;
	} = {
		inputShortcutPolicy: "ignore",
	},
) {
	const wasPressed = useRef(false);

	const useKeyPressOptions = {
		actInsideInputWithModifier: options.inputShortcutPolicy === "modifierOnly",
		preventDefault: options.preventDefault,
	};

	const isPressed = useKeyPress(key, useKeyPressOptions);

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
	const isCanvasFocused = data.ui.currentShortcutScope === "canvas";
	const canUseToolShortcuts = isCanvasFocused && !!toolbar;

	useKeyAction(
		key,
		() => toolbar?.setSelectedTool(toolFunction()),
		canUseToolShortcuts,
	);
}

interface UseKeyboardShortcutsOptions {
	onGenerate?: () => void;
}

export function useKeyboardShortcuts(
	options: UseKeyboardShortcutsOptions = {},
) {
	const { data } = useWorkflowDesigner();
	const {
		copy: handleCopy,
		paste: handlePaste,
		duplicate: handleDuplicate,
	} = useNodeManipulation();
	const { onGenerate } = options;

	const isCanvasFocused = data.ui.currentShortcutScope === "canvas";
	const isPropertiesPanelFocused =
		data.ui.currentShortcutScope === "properties-panel";

	// Tool shortcuts using the simplified hook
	useToolAction("t", selectTriggerTool);
	useToolAction("i", selectSourceCategoryTool);
	useToolAction("g", selectLanguageModelTool);
	useToolAction("r", selectRetrievalCategoryTool);
	useToolAction("d", selectActionTool);
	useToolAction("Escape", moveTool);

	// Generate shortcut for properties panel
	useKeyAction(
		["Meta+Enter", "Control+Enter"],
		() => onGenerate?.(),
		isPropertiesPanelFocused && !!onGenerate,
		{ inputShortcutPolicy: "modifierOnly" },
	);

	// Copy/Paste/Duplicate shortcuts
	useKeyAction(["Meta+c", "Control+c"], handleCopy, isCanvasFocused);
	useKeyAction(
		["Meta+v", "Control+v"],
		handlePaste,
		isCanvasFocused,
		{ preventDefault: false }, // Preserve browser paste events for FilePanel listeners
	);
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

	return {
		handleKeyDown,
	};
}
