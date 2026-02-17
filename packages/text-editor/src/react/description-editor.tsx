import { extensions as baseExtensions } from "@giselles-ai/text-editor-utils";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import clsx from "clsx/lite";
import { DescriptionMentionExtensionReact } from "./description-mention-extension";
import {
	createDescriptionSuggestion,
	type Suggestion,
} from "./description-suggestion";

export type { Suggestion };

export function DescriptionEditor({
	onValueChange,
	onSubmit,
	suggestions = [],
	placeholder: placeholderText,
	autoFocus,
	className,
}: {
	onValueChange?: (value: string) => void;
	onSubmit?: () => void;
	suggestions?: Suggestion[];
	placeholder?: string;
	autoFocus?: boolean;
	className?: string;
}) {
	const editor = useEditor({
		extensions: [
			...baseExtensions,
			DescriptionMentionExtensionReact,
			Mention.configure({
				suggestion: createDescriptionSuggestion(suggestions),
			}),
			Placeholder.configure({ placeholder: placeholderText }),
		],
		onUpdate: ({ editor }) => {
			onValueChange?.(editor.getText());
		},
		editorProps: {
			handleKeyDown: (_view, event) => {
				if (event.key === "Enter" && event.metaKey && onSubmit) {
					event.preventDefault();
					event.stopPropagation();
					onSubmit();
					return true;
				}
				return false;
			},
			attributes: {
				class: clsx("tiptap description-editor", className),
			},
		},
		autofocus: autoFocus ? "end" : false,
		immediatelyRender: false,
	});

	return <EditorContent editor={editor} />;
}
