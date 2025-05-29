import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import { createLowlight } from "lowlight";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

const lowlight = createLowlight();
lowlight.register("html", html);
lowlight.register("js", js);
lowlight.register("javascript", js);
lowlight.register("ts", ts);
lowlight.register("typescript", ts);

export const codeBlockHighlightKey = new PluginKey("codeBlockHighlight");

function getDecorations(doc: ProseMirrorNode): DecorationSet {
	const decorations: Decoration[] = [];

	doc.descendants((node, pos) => {
		if (node.type.name !== "code_block") {
			return;
		}

		const language = node.attrs.language;
		if (!language) {
			return;
		}

		try {
			const result = lowlight.highlight(language, node.textContent);
			let from = pos + 1; // +1 to account for the opening tag

			function processNodes(nodes: any[]): void {
				for (const highlightNode of nodes) {
					if (highlightNode.type === "text") {
						from += highlightNode.value.length;
					} else if (highlightNode.type === "element") {
						const className =
							highlightNode.properties?.className?.join(" ") || "";
						if (className && highlightNode.children) {
							const startPos = from;

							// Calculate the length of this element's content
							let length = 0;
							function calculateLength(children: any[]): void {
								for (const child of children) {
									if (child.type === "text") {
										length += child.value.length;
									} else if (child.children) {
										calculateLength(child.children);
									}
								}
							}
							calculateLength(highlightNode.children);

							if (length > 0) {
								decorations.push(
									Decoration.inline(startPos, startPos + length, {
										class: `hljs-${className.replace(/^hljs-/, "")}`,
									}),
								);
							}

							processNodes(highlightNode.children);
						} else if (highlightNode.children) {
							processNodes(highlightNode.children);
						}
					}
				}
			}

			if (result.children) {
				processNodes(result.children);
			}
		} catch (error) {
			// If highlighting fails, just skip it
			console.warn(
				`Failed to highlight code block with language "${language}":`,
				error,
			);
		}

		return false; // Don't descend into the code block's children
	});

	return DecorationSet.create(doc, decorations);
}

export function codeBlockHighlightPlugin(): Plugin {
	return new Plugin({
		key: codeBlockHighlightKey,
		state: {
			init(_, { doc }) {
				return getDecorations(doc);
			},
			apply(transaction, decorationSet, oldState, newState) {
				if (!transaction.docChanged) {
					return decorationSet.map(transaction.mapping, transaction.doc);
				}

				return getDecorations(newState.doc);
			},
		},
		props: {
			decorations(state) {
				return this.getState(state);
			},
		},
	});
}
