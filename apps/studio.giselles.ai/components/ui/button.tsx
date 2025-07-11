"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"w-full flex items-center px-[20px] py-[8px] bg-transparent rounded-[8px] shadow-xs text-[16px] font-medium font-sans font-normal leading-[21.6px] disabled:bg-black-70 disabled:text-black-80 data-[loading=true]:cursor-wait",
	{
		variants: {
			variant: {
				default:
					"justify-center text-black-900 bg-primary-200 border border-primary-200 gap-[8px] hover:bg-primary-100 hover:text-black-900",
				link: "text-white bg-transparent border-[0.5px] border-black-30 hover:bg-primary-200 hover:text-black-900",
				destructive:
					"justify-center bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

interface ButtonProps
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
