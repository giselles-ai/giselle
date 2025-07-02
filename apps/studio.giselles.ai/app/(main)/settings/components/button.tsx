"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

// FIXME: Consider integrating with apps/studio.giselles.ai/components/ui/button.tsx when releasing setting-v2
const buttonVariants = cva(
	"relative inline-flex items-center justify-center rounded-lg border-t border-b border-t-white/20 border-b-black/20 px-6 py-2 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.08)] transition-all duration-300 hover:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.1)]",
	{
		variants: {
			variant: {
				default:
					"bg-[rgba(60,90,160,0.15)] border border-white/10 shadow-[inset_0_0_12px_rgba(255,255,255,0.04)] hover:shadow-[inset_0_0_16px_rgba(255,255,255,0.06)]",
				link: "bg-black/20 border border-white/10 shadow-[inset_0_0_4px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.6)]",
				primary:
					"text-white/80 bg-gradient-to-b from-[#202530] to-[#12151f] border border-[rgba(0,0,0,0.7)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-200 active:scale-[0.98]",
				destructive:
					"text-error-900 bg-gradient-to-b from-error-900/15 to-error-900/5 border-error-900/80 shadow-[inset_0_1px_0_0_#F15B6C40,inset_0_-1px_0_0_rgba(0,0,0,0.2),0_0_8px_0_#F15B6C60] hover:from-error-900/25 hover:to-error-900/10 hover:border-error-900 hover:shadow-[inset_0_1px_0_0_#F15B6C50,inset_0_-1px_0_0_rgba(0,0,0,0.2),0_0_12px_0_#F15B6C80]",
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
