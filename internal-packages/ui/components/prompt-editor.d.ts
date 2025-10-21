import type { ReactNode } from "react";
type PromptEditorVariant = "plain" | "glass" | "solid" | "compact";
export declare function PromptEditor({
	value,
	onValueChange,
	nodes,
	connectedSources,
	placeholder,
	header,
	footer,
	showToolbar,
	variant,
	containerClassName,
	editorClassName,
}: {
	value?: string;
	onValueChange?: (value: string) => void;
	nodes?: unknown[];
	connectedSources?: unknown[];
	placeholder?: string;
	header?: ReactNode;
	footer?: ReactNode;
	showToolbar?: boolean;
	variant?: PromptEditorVariant;
	containerClassName?: string;
	editorClassName?: string;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=prompt-editor.d.ts.map
