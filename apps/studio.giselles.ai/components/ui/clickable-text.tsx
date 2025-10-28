"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const clickableTextVariant = cva(
	"text-black-30 leading-[23.8px] underline hover:text-black--70 font-[700]",
	{
		variants: {
			variant: {},
		},
	},
);
interface ClickableTextProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof clickableTextVariant> {
	asChild?: boolean;
}

const ClickableText = forwardRef<HTMLButtonElement, ClickableTextProps>(
	({ className, variant, asChild = false, type, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		const sharedProps = {
			className: cn(clickableTextVariant({ variant, className })),
			ref,
		};

		if (asChild) {
			return (
				<Comp
					{...sharedProps}
					{...props}
					{...(type !== undefined && { type })}
				/>
			);
		}

		return <Comp {...sharedProps} {...props} type={type ?? "button"} />;
	},
);
ClickableText.displayName = "ClickableText";

export { ClickableText };
