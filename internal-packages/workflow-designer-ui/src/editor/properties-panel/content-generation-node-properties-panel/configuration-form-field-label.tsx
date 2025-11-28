import clsx from "clsx/lite";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import type React from "react";

export function ConfigurationFormFieldLabel({
	label,
	tooltip,
	optional,
}: {
	label: string;
	tooltip?: React.ReactNode;
	optional?: boolean;
}) {
	const optionalBadge = optional ? (
		<span className="px-[6px] py-[2px] rounded-[4px] text-[11px] text-text-muted bg-bg border border-border">
			Optional
		</span>
	) : null;

	if (tooltip) {
		return (
			<TooltipPrimitive.Provider>
				<TooltipPrimitive.Root delayDuration={100}>
					<div className="flex items-center gap-2">
						<TooltipPrimitive.Trigger className="text-left data-[state=delayed-open]:underline decoration-dotted">
							<span className="text-[13px] text-text">{label}</span>
						</TooltipPrimitive.Trigger>
						{optionalBadge}
					</div>
					<TooltipPrimitive.Portal>
						<TooltipPrimitive.Content
							side="left"
							align="center"
							className={clsx(
								"group z-50 overflow-hidden rounded-md px-4 py-4 text-[12px] shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 max-w-[300px]",
								"bg-surface text-inverse",
							)}
							sideOffset={8}
						>
							{tooltip}
						</TooltipPrimitive.Content>
					</TooltipPrimitive.Portal>
				</TooltipPrimitive.Root>
			</TooltipPrimitive.Provider>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<span className="text-[13px] text-text">{label}</span>
			{optionalBadge}
		</div>
	);
}
