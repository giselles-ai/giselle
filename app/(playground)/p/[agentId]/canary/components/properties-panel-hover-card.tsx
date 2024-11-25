"use client";

import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

function HoverCardContent({
	className,
	align = "center",
	sideOffset = 4,
	side = "left",
	...props
}: ComponentProps<typeof HoverCardPrimitive.Content>) {
	return (
		<HoverCardPrimitive.Content
			align={align}
			side={side}
			sideOffset={sideOffset}
			className={cn(
				"z-50 w-64 rounded-[16px] border border-black-70 bg-black-100 p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
				className,
			)}
			{...props}
		/>
	);
}
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };