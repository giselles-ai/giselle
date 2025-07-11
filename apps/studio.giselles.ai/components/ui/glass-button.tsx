import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const glassButtonVariants = cva(
	"group relative overflow-hidden rounded-lg px-4 py-2 text-white transition-all duration-300 hover:scale-[1.01] active:scale-95 inline-flex items-center gap-1.5 font-sans text-[14px] font-medium",
	{
		variants: {
			variant: {
				default: "",
			},
			size: {
				default: "px-4 py-2",
				sm: "px-3 py-1.5 text-[12px]",
				lg: "px-6 py-3 text-[16px]",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

interface GlassButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof glassButtonVariants> {
	asChild?: boolean;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
	({ className, variant, size, asChild = false, children, ...props }, ref) => {
		if (asChild) {
			return (
				<Slot
					className={cn(glassButtonVariants({ variant, size, className }))}
					ref={ref}
					style={{
						boxShadow:
							"0 8px 20px rgba(107, 143, 240, 0.2), 0 3px 10px rgba(107, 143, 240, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.08)",
						background:
							"linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(107,143,240,0.15) 50%, rgba(107,143,240,0.25) 100%)",
					}}
					{...props}
				>
					{children}
				</Slot>
			);
		}

		return (
			<button
				className={cn(glassButtonVariants({ variant, size, className }))}
				ref={ref}
				style={{
					boxShadow:
						"0 8px 20px rgba(107, 143, 240, 0.2), 0 3px 10px rgba(107, 143, 240, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.08)",
					background:
						"linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(107,143,240,0.15) 50%, rgba(107,143,240,0.25) 100%)",
				}}
				{...props}
			>
				{/* Outer glow */}
				<div
					className="absolute inset-0 rounded-lg blur-[2px] -z-10"
					style={{ backgroundColor: "#6B8FF0", opacity: 0.08 }}
				/>

				{/* Main glass background */}
				<div
					className="absolute inset-0 rounded-lg backdrop-blur-md"
					style={{
						background:
							"linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(107,143,240,0.1) 50%, rgba(107,143,240,0.2) 100%)",
					}}
				/>

				{/* Top reflection */}
				<div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

				{/* Subtle border */}
				<div className="absolute inset-0 rounded-lg border border-white/20" />

				{/* Content */}
				<span className="relative z-10 flex items-center gap-1.5">
					{children}
				</span>

				{/* Hover overlay */}
				<div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
			</button>
		);
	},
);
GlassButton.displayName = "GlassButton";

export { GlassButton };
