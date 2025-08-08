import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { useKeyPress } from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
import { useCopyPasteNode, useDuplicateNode } from "../node";
import {
	moveTool,
	selectActionTool,
	selectLanguageModelTool,
	selectRetrievalCategoryTool,
	selectSourceCategoryTool,
	selectTriggerTool,
	useToolbar,
} from "../tool/toolbar";

// Browser shortcuts that should be prevented when canvas is focused
const BROWSER_SHORTCUTS_TO_PREVENT = [
	{ key: "d", modifiers: ["meta", "ctrl"] }, // Bookmark
	// Add more shortcuts here as needed:
	// { key: 's', modifiers: ['meta', 'ctrl'] }, // Save page
	// { key: 'p', modifiers: ['meta', 'ctrl'] }, // Print
];

export function useKeyboardShortcuts() {
	const duplicateNode = useDuplicateNode();
	const toolbar = useToolbar();
	const { data } = useWorkflowDesigner();
	const { copy: handleCopy, paste: handlePaste } = useCopyPasteNode();

	// Keep track of key press state to detect keydown (not held)
	const wasPressed = useRef<{ [key: string]: boolean }>({
		t: false,
		i: false,
		g: false,
		r: false,
		d: false,
		escape: false,
		modC: false,
		modV: false,
		modD: false,
	});

	// Use React Flow's useKeyPress hook with proper options
	const tPressed = useKeyPress("t", { actInsideInputWithModifier: false });
	const iPressed = useKeyPress("i", { actInsideInputWithModifier: false });
	const gPressed = useKeyPress("g", { actInsideInputWithModifier: false });
	const rPressed = useKeyPress("r", { actInsideInputWithModifier: false });
	const dPressed = useKeyPress("d", { actInsideInputWithModifier: false });
	const escapePressed = useKeyPress("Escape", {
		actInsideInputWithModifier: false,
	});

	// Only use keyboard shortcuts when canvas is focused
	const canUseShortcuts = data.ui.focusedArea === "canvas";

	// For modifier key shortcuts - conditionally use them
	const modCPressed = useKeyPress(
		canUseShortcuts ? ["Meta+c", "Control+c"] : null,
		{ actInsideInputWithModifier: false },
	);
	const modVPressed = useKeyPress(
		canUseShortcuts ? ["Meta+v", "Control+v"] : null,
		{ actInsideInputWithModifier: false },
	);
	const modDPressed = useKeyPress(
		canUseShortcuts ? ["Meta+d", "Control+d"] : null,
		{ actInsideInputWithModifier: false },
	);

	// Handle tool shortcuts
	useEffect(() => {
		if (data.ui.focusedArea !== "canvas" || !toolbar) return;

		if (tPressed && !wasPressed.current.t) {
			toolbar.setSelectedTool(selectTriggerTool());
		} else if (iPressed && !wasPressed.current.i) {
			toolbar.setSelectedTool(selectSourceCategoryTool());
		} else if (gPressed && !wasPressed.current.g) {
			toolbar.setSelectedTool(selectLanguageModelTool());
		} else if (rPressed && !wasPressed.current.r) {
			toolbar.setSelectedTool(selectRetrievalCategoryTool());
		} else if (dPressed && !wasPressed.current.d) {
			toolbar.setSelectedTool(selectActionTool());
		} else if (escapePressed && !wasPressed.current.escape) {
			toolbar.setSelectedTool(moveTool());
		}

		// Update pressed state
		wasPressed.current.t = tPressed;
		wasPressed.current.i = iPressed;
		wasPressed.current.g = gPressed;
		wasPressed.current.r = rPressed;
		wasPressed.current.d = dPressed;
		wasPressed.current.escape = escapePressed;
	}, [
		tPressed,
		iPressed,
		gPressed,
		rPressed,
		dPressed,
		escapePressed,
		toolbar,
		data.ui.focusedArea,
	]);

	// Handle copy/paste/duplicate shortcuts
	useEffect(() => {
		// Only handle shortcuts when canvas is focused
		if (data.ui.focusedArea !== "canvas") return;

		if (modCPressed && !wasPressed.current.modC) {
			handleCopy();
		} else if (modVPressed && !wasPressed.current.modV) {
			handlePaste();
		} else if (modDPressed && !wasPressed.current.modD) {
			duplicateNode();
		}

		// Update pressed state
		wasPressed.current.modC = modCPressed;
		wasPressed.current.modV = modVPressed;
		wasPressed.current.modD = modDPressed;
	}, [
		modCPressed,
		modVPressed,
		modDPressed,
		handleCopy,
		handlePaste,
		duplicateNode,
		data.ui.focusedArea,
	]);

	// Return handler for preventing browser default shortcuts
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent) => {
			// Only prevent defaults when focused on canvas
			if (data.ui.focusedArea !== "canvas") return;

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
		[data.ui.focusedArea],
	);

	return { handleKeyDown };
}
