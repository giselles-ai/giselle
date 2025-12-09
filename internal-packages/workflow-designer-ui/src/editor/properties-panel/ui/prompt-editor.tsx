import type { UIConnection } from "@giselles-ai/react";
import { TextEditor } from "@giselles-ai/text-editor/react";
import type { ReactNode } from "react";

interface PromptEditorProps {
	value?: string;
	onValueChange?: (value: string) => void;
	connections?: UIConnection[];
	placeholder?: string;
	header?: ReactNode;
}

export function PromptEditor({
	value,
	onValueChange,
	connections,
	placeholder,
	header,
}: PromptEditorProps) {
	return (
		<TextEditor
			value={value}
			onValueChange={onValueChange}
			placeholder={placeholder}
			connections={connections}
			showToolbar={false}
			header={header}
			editorClassName="bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] border-none py-[4px] px-[8px] rounded-[8px] h-full min-h-[80px]"
			editorContainerProps={{
				className: "grow-1",
			}}
		/>
	);
}
