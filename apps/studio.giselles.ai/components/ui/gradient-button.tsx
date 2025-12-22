import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const gradientButtonVariants = cva(
	"inline-flex w-full items-center justify-center rounded-full px-6 py-3 font-sans font-medium transition-all duration-300 shadow-lg hover:shadow-xl",
	{
		variants: {
			variant: {
				primary:
					"bg-gradient-to-b from-[#1663F3] to-[#4A90E2] text-white hover:from-[#0F52BA] hover:to-[#367BFD]",
				disabled:
					"bg-gradient-to-b from-gray-600 to-gray-700 text-white cursor-not-allowed opacity-70",
			},
			size: {
				default: "text-sm sm:text-base",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "default",
		},
	},
);

interface GradientButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof gradientButtonVariants> {
	asChild?: boolean;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(gradientButtonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
GradientButton.displayName = "GradientButton";

export { GradientButton };

