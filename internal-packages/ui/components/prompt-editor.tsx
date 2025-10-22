import { TextEditor } from "@giselle-sdk/text-editor/react";
import clsx from "clsx/lite";
import { Maximize2 } from "lucide-react";
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
	showExpandIcon = false,
	onExpand,
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
	showExpandIcon?: boolean;
	onExpand?: () => void;
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
			<div className="relative">
				<TextEditor
					value={value}
					onValueChange={onValueChange}
					nodes={nodes}
					connectedSources={connectedSources}
					placeholder={placeholder}
					header={header}
					showToolbar={showToolbar}
					editorClassName="bg-inverse/10 border-none !pt-[4px] !pr-[8px] !pb-[4px] !pl-[12px] rounded-[8px] min-h-[120px]"
				/>
				{showExpandIcon && (
					<button
						type="button"
						onClick={onExpand}
						className="absolute bottom-[8px] right-[8px] size-[24px] rounded-[6px] bg-transparent hover:bg-inverse/10 flex items-center justify-center transition-colors"
						aria-label="Expand"
					>
						<Maximize2 className="size-[14px] text-inverse" />
					</button>
				)}
			</div>
			{footer ? (
				<div className={clsx("mt-2", editorClassName)}>{footer}</div>
			) : null}
		</div>
	);
}
