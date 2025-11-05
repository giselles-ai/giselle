import type { Node } from "@giselles-ai/protocol";
import type { ConnectedSource } from "@giselles-ai/text-editor/react";
import { TextEditor } from "@giselles-ai/text-editor/react";
import clsx from "clsx/lite";
import { Maximize2 } from "lucide-react";
import type { ReactNode } from "react";

type PromptEditorVariant = "plain" | "glass" | "solid" | "compact";

interface PromptEditorProps {
	value?: string;
	onValueChange?: (value: string) => void;
	nodes?: Node[];
	connectedSources?: ConnectedSource[];
	placeholder?: string;
	header?: ReactNode;
	footer?: ReactNode;
	showToolbar?: boolean;
	variant?: PromptEditorVariant;
	containerClassName?: string;
	editorClassName?: string;
	showExpandIcon?: boolean;
	onExpand?: () => void;
	expandIconPosition?: "left" | "right";
	minHeightClass?: string;
	fullHeight?: boolean;
}

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
	expandIconPosition = "right",
	minHeightClass = "min-h-[120px]",
	fullHeight = false,
}: PromptEditorProps) {
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
			<div className="relative h-full flex-1 min-h-0">
				<TextEditor
					value={value}
					onValueChange={onValueChange}
					nodes={nodes}
					connectedSources={connectedSources}
					placeholder={placeholder}
					header={header}
					showToolbar={showToolbar}
					editorClassName={clsx(
						"bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] border-none !pt-[4px] !pr-[8px] !pb-[4px] !pl-[12px] rounded-[8px]",
						minHeightClass,
						editorClassName,
					)}
					fullHeight={fullHeight}
				/>
				{showExpandIcon && (
					<button
						type="button"
						onClick={onExpand}
						className={clsx(
							"absolute bottom-[10px] size-[32px] rounded-full bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_20%,transparent)] flex items-center justify-center transition-colors group",
							expandIconPosition === "left" ? "left-[10px]" : "right-[10px]",
						)}
						aria-label="Expand"
					>
						<Maximize2 className="size-[16px] text-[var(--color-text-inverse)] group-hover:text-inverse/80" />
					</button>
				)}
			</div>
			{footer ? (
				<div className={clsx("mt-2", editorClassName)}>{footer}</div>
			) : null}
		</div>
	);
}
