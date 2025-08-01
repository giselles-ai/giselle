import { useKeyPress } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { useCopyPasteNode, useDuplicateNode } from "../node";
import {
	moveTool,
	selectFileNodeCategoryTool,
	selectLanguageModelTool,
	selectRetrievalCategoryTool,
	selectSourceCategoryTool,
	useToolbar,
} from "../tool/toolbar";

const ignoredTags = ["INPUT", "TEXTAREA", "SELECT"];

function isInputActive(): boolean {
	const activeElement = document.activeElement as HTMLElement | null;
	return !!(
		activeElement &&
		(ignoredTags.includes(activeElement.tagName) ||
			activeElement.isContentEditable)
	);
}

export function useKeyboardShortcuts() {
	const duplicateNode = useDuplicateNode();
	const { copy, paste } = useCopyPasteNode();
	const toolbar = useToolbar();

	// Track previous key states to prevent infinite loops
	const previousKeyStates = useRef({
		g: false,
		s: false,
		u: false,
		r: false,
		escape: false,
		copy: false,
		paste: false,
		duplicate: false,
	});

	// Keyboard shortcuts using useKeyPress hook
	const gPressed = useKeyPress("g");
	const sPressed = useKeyPress("s");
	const uPressed = useKeyPress("u");
	const rPressed = useKeyPress("r");
	const escapePressed = useKeyPress("Escape");
	const copyPressed = useKeyPress(["Meta+c", "Control+c"]);
	const pastePressed = useKeyPress(["Meta+v", "Control+v"]);
	const duplicatePressed = useKeyPress(["Meta+d", "Control+d"]);

	// Handle tool selection shortcuts
	useEffect(() => {
		if (
			gPressed &&
			!previousKeyStates.current.g &&
			!isInputActive() &&
			toolbar
		) {
			toolbar.setSelectedTool(selectLanguageModelTool());
		}
		previousKeyStates.current.g = gPressed;
	}, [gPressed, toolbar]);

	useEffect(() => {
		if (
			sPressed &&
			!previousKeyStates.current.s &&
			!isInputActive() &&
			toolbar
		) {
			toolbar.setSelectedTool(selectSourceCategoryTool());
		}
		previousKeyStates.current.s = sPressed;
	}, [sPressed, toolbar]);

	useEffect(() => {
		if (
			uPressed &&
			!previousKeyStates.current.u &&
			!isInputActive() &&
			toolbar
		) {
			toolbar.setSelectedTool(selectFileNodeCategoryTool());
		}
		previousKeyStates.current.u = uPressed;
	}, [uPressed, toolbar]);

	useEffect(() => {
		if (
			rPressed &&
			!previousKeyStates.current.r &&
			!isInputActive() &&
			toolbar
		) {
			toolbar.setSelectedTool(selectRetrievalCategoryTool());
		}
		previousKeyStates.current.r = rPressed;
	}, [rPressed, toolbar]);

	useEffect(() => {
		if (
			escapePressed &&
			!previousKeyStates.current.escape &&
			!isInputActive() &&
			toolbar
		) {
			toolbar.setSelectedTool(moveTool());
		}
		previousKeyStates.current.escape = escapePressed;
	}, [escapePressed, toolbar]);

	// Handle copy/paste/duplicate shortcuts
	useEffect(() => {
		if (copyPressed && !previousKeyStates.current.copy && !isInputActive()) {
			copy();
		}
		previousKeyStates.current.copy = copyPressed;
	}, [copyPressed, copy]);

	useEffect(() => {
		if (pastePressed && !previousKeyStates.current.paste && !isInputActive()) {
			paste();
		}
		previousKeyStates.current.paste = pastePressed;
	}, [pastePressed, paste]);

	useEffect(() => {
		if (
			duplicatePressed &&
			!previousKeyStates.current.duplicate &&
			!isInputActive()
		) {
			duplicateNode();
		}
		previousKeyStates.current.duplicate = duplicatePressed;
	}, [duplicatePressed, duplicateNode]);
}
