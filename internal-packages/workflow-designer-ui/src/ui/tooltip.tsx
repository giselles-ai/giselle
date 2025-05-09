import clsx from "clsx/lite";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import type { ComponentProps, ReactNode } from "react";

export type TooltipProps = Omit<
	ComponentProps<typeof TooltipPrimitive.Trigger>,
	"asChild"
> & {
	children: ReactNode;
	text: ReactNode;
	sideOffset?: number;
	delayDuration?: number;
	className?: string;
};

export function Tooltip({
	text,
	sideOffset = 8,
	delayDuration = 300,
	className,
	...props
}: TooltipProps) {
	return (
		<TooltipPrimitive.Provider>
			<TooltipPrimitive.Root delayDuration={delayDuration}>
				<TooltipPrimitive.Trigger asChild {...props} />
				<TooltipPrimitive.Portal>
					<TooltipPrimitive.Content
						className={clsx(
							"z-50 overflow-hidden rounded-md bg-[#97A2BE] px-2 py-1 text-xs text-black-850 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
							className,
						)}
						sideOffset={sideOffset}
					>
						{text}
						<TooltipPrimitive.Arrow
							className="fill-[#97A2BE] border-[hsla(232,36%,72%,0.2)]"
							width={12}
							height={6}
						/>
					</TooltipPrimitive.Content>
				</TooltipPrimitive.Portal>
			</TooltipPrimitive.Root>
		</TooltipPrimitive.Provider>
	);
}
