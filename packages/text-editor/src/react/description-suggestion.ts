import { createDescriptionMentionJSONContent } from "@giselles-ai/text-editor-utils";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import {
	type DescriptionSuggestionItem,
	DescriptionSuggestionList,
	type DescriptionSuggestionListRef,
} from "./description-suggestion-list";

export interface Suggestion {
	label: string;
	apply: string;
}

export function createDescriptionSuggestion(
	suggestions: Suggestion[],
): Omit<SuggestionOptions<DescriptionSuggestionItem>, "editor"> {
	return {
		char: "@",
		items: ({ query }) => {
			const items: DescriptionSuggestionItem[] = suggestions.map(
				(s, index) => ({
					id: `suggestion-${index}`,
					label: s.label,
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
			let component: ReactRenderer<DescriptionSuggestionListRef> | undefined;
			let popup: HTMLElement | undefined;
			let escapeHandler: ((event: KeyboardEvent) => void) | undefined;
			let pointerDownHandler: ((event: PointerEvent) => void) | undefined;

			return {
				onStart: (props) => {
					component = new ReactRenderer(DescriptionSuggestionList, {
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
					createDescriptionMentionJSONContent({
						id: props.id,
						label: props.label,
					}),
				)
				.insertContent(" ")
				.run();
		},
	};
}
