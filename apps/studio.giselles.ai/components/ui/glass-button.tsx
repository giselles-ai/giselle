import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const glassButtonVariants = cva(
	"group relative overflow-hidden rounded-lg px-4 py-2 text-white transition-all duration-300 hover:scale-[1.01] active:scale-95 inline-flex items-center justify-center gap-1.5 font-sans text-[14px] font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 disabled:active:scale-100",
	{
		variants: {
			variant: {
				default: "",
				muted: "text-white/80",
				comingSoon: "text-white/40 opacity-70",
				currentPlan: "text-white/55",
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
	disableHoverFill?: boolean;
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			disableHoverFill = false,
			children,
			...props
		},
		ref,
	) => {
		const styles =
			variant === "comingSoon"
				? {
						boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
						background: "rgba(255, 255, 255, 0.05)",
					}
				: variant === "currentPlan"
					? {
							boxShadow:
								"0 10px 30px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
							background: "rgba(255, 255, 255, 0.04)",
						}
					: variant === "muted"
						? {
								boxShadow:
									"0 8px 20px rgba(255, 255, 255, 0.05), 0 3px 10px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 -1px 0 rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.08)",
								background:
									"linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.06) 50%, rgba(0,0,0,0.18) 100%)",
							}
						: {
								boxShadow:
									"0 8px 20px rgba(107, 143, 240, 0.2), 0 3px 10px rgba(107, 143, 240, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.08)",
								background:
									"linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(107,143,240,0.15) 50%, rgba(107,143,240,0.25) 100%)",
							};

		if (asChild) {
			return (
				<Slot
					className={cn(glassButtonVariants({ variant, size, className }))}
					ref={ref}
					style={styles}
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
				style={styles}
				{...props}
			>
				{/* Outer glow */}
				<div
					className="absolute inset-0 rounded-lg blur-[2px] -z-10"
					style={{
						backgroundColor:
							variant === "comingSoon" || variant === "currentPlan"
								? "#FFFFFF"
								: variant === "muted"
									? "#FFFFFF"
									: "#6B8FF0",
						opacity:
							variant === "comingSoon"
								? 0.015
								: variant === "currentPlan"
									? 0.03
									: variant === "muted"
										? 0.05
										: 0.08,
					}}
				/>

				{variant !== "comingSoon" && (
					<>
						{/* Top reflection */}
						<div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

						{/* Subtle border */}
						<div className="absolute inset-0 rounded-lg border border-white/20" />
					</>
				)}

				{/* Content */}
				<span className="flex items-center gap-1.5">{children}</span>

				{/* Hover overlay */}
				{variant !== "comingSoon" &&
					variant !== "currentPlan" &&
					disableHoverFill !== true &&
					props.disabled !== true && (
						<div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center" />
					)}
			</button>
		);
	},
);
GlassButton.displayName = "GlassButton";

export { GlassButton };
