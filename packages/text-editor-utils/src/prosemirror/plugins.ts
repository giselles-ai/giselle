import { baseKeymap } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";
import { codeBlockHighlightPlugin } from "./code-highlight";
import { buildInputRules } from "./input-rules";

export function createPlugins(schema: Schema): Plugin[] {
	return [
		// History plugin for undo/redo
		history(),

		// Input rules for markdown-like typing
		buildInputRules(schema),

		// Keymap for keyboard shortcuts
		keymap({
			"Mod-z": undo,
			"Mod-y": redo,
			"Mod-Shift-z": redo,
			"Mod-b": (state, dispatch) => {
				const markType = schema.marks.strong;
				if (!markType) return false;

				const { selection } = state;
				if (selection.empty) {
					const storedMarks = state.tr.storedMarks || selection.$from.marks();
					if (markType.isInSet(storedMarks)) {
						dispatch?.(state.tr.removeStoredMark(markType));
					} else {
						dispatch?.(state.tr.addStoredMark(markType.create()));
					}
				} else {
					if (state.doc.rangeHasMark(selection.from, selection.to, markType)) {
						dispatch?.(
							state.tr.removeMark(selection.from, selection.to, markType),
						);
					} else {
						dispatch?.(
							state.tr.addMark(selection.from, selection.to, markType.create()),
						);
					}
				}
				return true;
			},
			"Mod-i": (state, dispatch) => {
				const markType = schema.marks.em;
				if (!markType) return false;

				const { selection } = state;
				if (selection.empty) {
					const storedMarks = state.tr.storedMarks || selection.$from.marks();
					if (markType.isInSet(storedMarks)) {
						dispatch?.(state.tr.removeStoredMark(markType));
					} else {
						dispatch?.(state.tr.addStoredMark(markType.create()));
					}
				} else {
					if (state.doc.rangeHasMark(selection.from, selection.to, markType)) {
						dispatch?.(
							state.tr.removeMark(selection.from, selection.to, markType),
						);
					} else {
						dispatch?.(
							state.tr.addMark(selection.from, selection.to, markType.create()),
						);
					}
				}
				return true;
			},
		}),

		// Base keymap with default shortcuts
		keymap(baseKeymap),

		// Drop cursor for drag and drop
		dropCursor(),

		// Gap cursor for placing cursor in places where it's normally not possible
		gapCursor(),

		// Code block syntax highlighting
		codeBlockHighlightPlugin(),
	];
}
