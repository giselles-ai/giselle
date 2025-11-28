import { defaultName } from "@giselles-ai/node-registry";
import type { UIConnection } from "@giselles-ai/react";
import { createSourceExtensionJSONContent } from "@giselles-ai/text-editor-utils";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import {
	type SuggestionItem,
	SuggestionList,
	type SuggestionListRef,
} from "./suggestion-list";

export function createSuggestion(
	connections: UIConnection[] | undefined,
): Omit<SuggestionOptions<SuggestionItem>, "editor"> {
	return {
		char: "@",
		items: ({ query }) => {
			if (connections === undefined) {
				return [];
			}

			const items: SuggestionItem[] = connections.map(
				({ outputNode, output }) => ({
					id: output.id,
					node: outputNode,
					output,
					label: `${outputNode.name ?? defaultName(outputNode)} / ${output.label}`,
				}),
			);

			if (query === "") {
				return items;
			}

			const lowerQuery = query.toLowerCase();
			return items.filter((item) =>
				item.label.toLowerCase().includes(lowerQuery),
			);
		},

		render: () => {
			let component: ReactRenderer<SuggestionListRef> | undefined;
			let popup: HTMLElement | undefined;
			let escapeHandler: ((event: KeyboardEvent) => void) | undefined;
			let pointerDownHandler: ((event: PointerEvent) => void) | undefined;

			return {
				onStart: (props) => {
					component = new ReactRenderer(SuggestionList, {
						props,
						editor: props.editor,
					});

					if (!props.clientRect) {
						return;
					}

					popup = document.createElement("div");
					popup.style.position = "absolute";
					popup.style.zIndex = "9999";
					popup.appendChild(component.element);
					document.body.appendChild(popup);

					const rect = props.clientRect();
					if (rect) {
						popup.style.top = `${rect.bottom + window.scrollY}px`;
						popup.style.left = `${rect.right + window.scrollX}px`;
					}

					// Add global Escape key handler
					escapeHandler = (event: KeyboardEvent) => {
						if (popup === undefined) {
							return;
						}
						if (event.key === "Escape") {
							popup.style.display = "none";
						}
					};
					document.addEventListener("keydown", escapeHandler);

					pointerDownHandler = (event: PointerEvent) => {
						if (popup === undefined) {
							return;
						}
						const target = event.target;
						if (target instanceof Node && popup.contains(target)) {
							return;
						}
						popup.style.display = "none";
					};
					document.addEventListener("pointerdown", pointerDownHandler);
				},

				onUpdate(props) {
					component?.updateProps(props);
					if (popup === undefined) {
						return;
					}

					// Re-show popup if it was hidden by Escape
					if (popup.style.display === "none") {
						popup.style.display = "block";
					}
				},

				onKeyDown(props) {
					return component?.ref?.onKeyDown(props) ?? false;
				},

				onExit() {
					if (escapeHandler) {
						document.removeEventListener("keydown", escapeHandler);
					}
					if (pointerDownHandler) {
						document.removeEventListener("pointerdown", pointerDownHandler);
					}
					popup?.remove();
					component?.destroy();
				},
			};
		},

		command: ({ editor, range, props }) => {
			editor
				.chain()
				.focus()
				.deleteRange(range)
				.insertContentAt(
					range.from,
					createSourceExtensionJSONContent({
						node: {
							id: props.node.id,
							type: props.node.type,
							content: props.node.content,
						},
						outputId: props.output.id,
					}),
				)
				.insertContent(" ")
				.run();
		},
	};
}
