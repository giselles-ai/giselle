"use client";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

// FIXME: Consider integrating with apps/studio.giselles.ai/components/ui/button.tsx when releasing setting-v2
const buttonVariants = cva(
	"w-full flex items-center px-[16px] py-[4px] bg-transparent rounded-[6.32px] border text-[14px] font-bold font-hubot leading-[19.6px] tracking-normal disabled:bg-black-70 disabled:text-black-80 data-[loading=true]:cursor-wait cursor-pointer",
	{
		variants: {
			variant: {
				default:
					"justify-center text-black-800 bg-primary-200 border-primary200 gap-[8px] hover:bg-transparent hover:text-primary-200",
				link: "flex-start gap-[40px] text-white bg-transparent border-black-30 hover:bg-black-30 hover:text-black-80",
				destructive:
					"justify-center bg-destructive text-destructive-foreground hover:bg-destructive/90",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
