"use client";

import { Select } from "@giselle-internal/ui/select";
import { Paperclip } from "lucide-react";

type InputAreaHeaderControlsOption = { value: string; label: string };

export function InputAreaHeaderControls({
	options,
	value,
	onValueChange,
	onAttachmentButtonClick,
	isDisabled,
	selectContainerClassName = "w-[200px]",
}: {
	options: InputAreaHeaderControlsOption[];
	value?: string;
	onValueChange?: (value: string) => void;
	onAttachmentButtonClick?: () => void;
	isDisabled?: boolean;
	selectContainerClassName?: string;
}) {
	const isAttachmentDisabled = isDisabled || onAttachmentButtonClick == null;
	const isSelectDisabled = isDisabled || onValueChange == null;

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				onClick={onAttachmentButtonClick}
				disabled={isAttachmentDisabled}
				className="group flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-[4px] transition-colors hover:bg-white/5 disabled:hover:bg-transparent"
				aria-label="Attach files"
			>
				<Paperclip className="h-3.5 w-3.5 text-text-muted/80 transition-colors group-hover:text-white group-disabled:text-text-muted/70" />
			</button>
			<div className={selectContainerClassName}>
				<Select
					options={options}
					placeholder="Select an app..."
					value={value}
					widthClassName="w-full"
					onValueChange={onValueChange}
					disabled={isSelectDisabled}
					side="top"
					triggerClassName="border border-border !bg-[rgba(131,157,195,0.1)] hover:!bg-[rgba(131,157,195,0.18)] !px-2 !h-7 !rounded-[6px] text-[12px] [&_svg]:opacity-70"
				/>
			</div>
		</div>
	);
}
