import clsx from "clsx/lite";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

type TooltipProps = Omit<
	ComponentProps<typeof TooltipPrimitive.Trigger>,
	"asChild"
> & {
	children: ReactNode;
	text: ReactNode;
	sideOffset?: number;
	delayDuration?: number;
};

export function Tooltip({
	text,
	sideOffset = 4,
	delayDuration = 300,
	...props
}: TooltipProps) {
	return (
		<TooltipPrimitive.Provider>
			<TooltipPrimitive.Root delayDuration={delayDuration}>
				<TooltipPrimitive.Trigger asChild {...props} />
				<TooltipPrimitive.Portal>
					<TooltipPrimitive.Content
						sideOffset={sideOffset}
						className={clsx(
							"z-50 overflow-hidden rounded-md px-[8px] py-[2px]",
							"bg-primary-60",
							"text-xs text-black-900 shadow-sm",
						)}
					>
						{text}
					</TooltipPrimitive.Content>
				</TooltipPrimitive.Portal>
			</TooltipPrimitive.Root>
		</TooltipPrimitive.Provider>
	);
}
