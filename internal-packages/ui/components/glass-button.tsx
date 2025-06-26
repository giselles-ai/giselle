"use client";

import { PlusIcon } from "lucide-react";
import type { ReactNode } from "react";
// CSS classes are now used for better performance

interface GlassButtonProps {
	children: ReactNode;
	onClick?: () => void;
	onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
	type?: "button" | "submit" | "reset";
	className?: string;
}

export function GlassButton({
	children,
	onClick,
	onKeyDown,
	type = "button",
	className = "",
}: GlassButtonProps) {
	return (
		<button
			type={type}
			onClick={onClick}
			onKeyDown={
				onKeyDown ||
				(onClick ? (e) => e.key === "Enter" && onClick() : undefined)
			}
			className={`glass-button group relative overflow-hidden rounded-lg px-4 py-2 text-white transition-all duration-300 hover:scale-[1.01] active:scale-95 ${className}`}
		>
			{/* Outer glow */}
			<div className="glass-button-outer-glow absolute inset-0 rounded-lg blur-[2px] -z-10" />

			{/* Main glass background */}
			<div className="glass-button-background absolute inset-0 rounded-lg backdrop-blur-md" />

			{/* Top reflection */}
			<div className="glass-button-top-reflection absolute top-0 left-4 right-4 h-px" />

			{/* Subtle border */}
			<div className="glass-button-border absolute inset-0 rounded-lg" />

			{/* Content */}
			<span className="relative z-10 flex items-center gap-2">{children}</span>

			{/* Hover overlay */}
			<div className="glass-button-hover-overlay absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
		</button>
	);
}

export function AddDataSourceButton({ onClick }: { onClick?: () => void }) {
	return (
		<GlassButton
			onClick={onClick}
			onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) =>
				e.key === "Enter" && onClick && onClick()
			}
		>
			<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
				<PlusIcon className="size-3 text-black-900" />
			</span>
			<span className="text-[14px] leading-[20px] font-medium">
				Add Data Source
			</span>
		</GlassButton>
	);
}
