"use client";

import { GlassSurfaceLayers } from "@giselle-internal/ui/glass-surface";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../../components/button";

type GlassDialogContentProps = React.ComponentPropsWithoutRef<
	typeof Dialog.Content
> & {
	variant?: "default" | "destructive";
	borderStyle?: "gradient" | "solid";
	withBaseFill?: boolean;
	overlayClassName?: string;
};

export const GlassDialogContent = React.forwardRef<
	React.ElementRef<typeof Dialog.Content>,
	GlassDialogContentProps
>(
	(
		{
			className,
			children,
			variant = "default",
			borderStyle = "gradient",
			withBaseFill = false,
			overlayClassName,
			...props
		},
		ref,
	) => {
		// Avoid muddy look on destructive: force solid border with opaque styling
		const effectiveBorderStyle =
			variant === "destructive"
				? "destructive"
				: borderStyle === "gradient"
					? "gradient"
					: "solid";

		return (
			<Dialog.Portal>
				<Dialog.Overlay
					className={cn("fixed inset-0 z-50", overlayClassName)}
					style={{ background: "var(--color-dialog-overlay)" }}
				/>
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<Dialog.Content
						ref={ref}
						className={cn(
							"relative z-10 w-[90vw] max-w-[600px] max-h-[85vh] rounded-[12px] p-6 flex flex-col",
							"shadow-xl focus:outline-none",
							className,
						)}
						{...props}
					>
						<GlassSurfaceLayers
							variant={variant === "destructive" ? "destructive" : "default"}
							borderStyle={effectiveBorderStyle}
							withTopHighlight={true}
							withBaseFill={withBaseFill || variant === "destructive"}
							baseFillClass={
								variant === "destructive" ? "bg-error-900/10" : undefined
							}
							zIndexClass="z-0"
						/>
						<div className="relative z-10 flex flex-col min-h-0">
							{children}
						</div>
					</Dialog.Content>
				</div>
			</Dialog.Portal>
		);
	},
);
GlassDialogContent.displayName = "GlassDialogContent";

type GlassDialogHeaderProps = {
	title: string;
	description: string;
	onClose: () => void;
	variant?: "default" | "destructive";
};

export const GlassDialogHeader = ({
	title,
	description,
	onClose,
	variant = "default",
}: GlassDialogHeaderProps) => (
	<>
		<div className="flex items-center justify-between">
			<Dialog.Title
				className={cn(
					"font-sans text-[20px] font-medium tracking-tight text-white-400",
					{
						"text-error-900": variant === "destructive",
					},
				)}
			>
				{title}
			</Dialog.Title>
			<Dialog.Close
				onClick={onClose}
				className="rounded-sm text-white-400 opacity-70 hover:opacity-100 focus:outline-none"
			>
				<X className="h-5 w-5" />
				<span className="sr-only">Close</span>
			</Dialog.Close>
		</div>
		<Dialog.Description
			className={cn("font-geist mt-2 text-[14px] text-black-400", {
				"text-error-900/50": variant === "destructive",
			})}
		>
			{description}
		</Dialog.Description>
	</>
);

export const GlassDialogBody = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<div
		className={cn("mt-4 mb-0 overflow-y-auto flex-1 min-h-0 pr-2", className)}
	>
		{children}
	</div>
);

type GlassDialogFooterProps = {
	onCancel: () => void;
	onConfirm?: () => void;
	confirmLabel: string;
	isPending?: boolean;
	isConfirmDisabled?: boolean;
	variant?: "default" | "destructive";
	confirmButtonType?: "button" | "submit";
};

export const GlassDialogFooter = ({
	onCancel,
	onConfirm,
	confirmLabel,
	isPending = false,
	isConfirmDisabled = false,
	variant = "default",
	confirmButtonType = "button",
}: GlassDialogFooterProps) => {
	return (
		<div className="mt-6 flex justify-end gap-x-3">
			<button
				type="button"
				onClick={onCancel}
				disabled={isPending}
				className={buttonVariants({ variant: "link" })}
				aria-label="Cancel"
			>
				Cancel
			</button>
			<button
				type={confirmButtonType}
				onClick={onConfirm}
				disabled={isPending || isConfirmDisabled}
				className={cn(
					buttonVariants({
						variant: variant === "destructive" ? "destructive" : "primary",
					}),
					"whitespace-nowrap",
				)}
				aria-label={confirmLabel}
			>
				{isPending ? "Processing..." : confirmLabel}
			</button>
		</div>
	);
};
