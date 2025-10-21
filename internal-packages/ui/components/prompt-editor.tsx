import { TextEditor } from "@giselle-sdk/text-editor/react";
import clsx from "clsx/lite";
import type { ReactNode } from "react";

type PromptEditorVariant = "plain" | "glass" | "solid" | "compact";

export function PromptEditor({
	value,
	onValueChange,
	nodes,
	connectedSources,
	placeholder,
	header,
	footer,
	showToolbar = false,
	variant = "plain",
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
}) {
	const variantClass =
		variant === "glass"
			? "rounded-[8px] p-[8px] bg-transparent"
			: variant === "solid"
				? "rounded-[8px] p-[8px] bg-bg/10"
				: variant === "compact"
					? "rounded-[6px] p-[6px]"
					: "";

	return (
		<div
			className={clsx(
				"flex flex-col w-full min-h-0",
				variantClass,
				containerClassName,
			)}
		>
			<TextEditor
				value={value}
				onValueChange={onValueChange}
				nodes={nodes as any}
				connectedSources={connectedSources as any}
				placeholder={placeholder}
				header={header}
				showToolbar={showToolbar}
				editorClassName="bg-inverse/10 border-none !pt-[4px] !pr-[8px] !pb-[4px] !pl-[12px] rounded-[8px] min-h-[120px]"
			/>
			{footer ? (
				<div className={clsx("mt-2", editorClassName)}>{footer}</div>
			) : null}
		</div>
	);
}
