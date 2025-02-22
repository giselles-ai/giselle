"use client";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const clickableTextVariant = cva(
	"text-black-30 leading-[23.8px] underline hover:text-black--70 font-avenir font-[900]",
	{
		variants: {
			variant: {},
		},
	},
);
export interface ClickableTextProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof clickableTextVariant> {
	asChild?: boolean;
}

const ClickableText = forwardRef<HTMLButtonElement, ClickableTextProps>(
	({ className, variant, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(clickableTextVariant({ variant, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
ClickableText.displayName = "ClicableText";

export { ClickableText, clickableTextVariant as linkTextVariants };
