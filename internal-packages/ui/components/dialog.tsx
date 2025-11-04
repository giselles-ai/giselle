import clsx from "clsx/lite";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import { GlassSurfaceLayers } from "./glass-surface";

export const Dialog = DialogPrimitive.Root;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export type DialogSize = "default" | "wide";
export type DialogVariant = "default" | "glass" | "destructive";

export type DialogContentProps = ComponentPropsWithoutRef<
	typeof DialogPrimitive.Content
> & {
	size?: DialogSize;
	variant?: DialogVariant;
};

export function DialogContent({
	children,
	size = "default",
	variant = "default",
	className,
	...props
}: DialogContentProps) {
	const isGlass = variant === "glass" || variant === "destructive";

	return (
		<DialogPortal>
			<DialogPrimitive.Overlay
				className="fixed inset-0 z-50"
				style={{ background: "var(--color-dialog-overlay)" }}
			/>
			{isGlass ? (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
					<DialogPrimitive.Content
						{...props}
						className={clsx(
							"relative z-10 w-[90vw] max-w-[600px] max-h-[85vh] rounded-[12px] p-6 flex flex-col",
							"shadow-xl focus:outline-none",
							className,
						)}
					>
					<GlassSurfaceLayers
						variant={variant === "destructive" ? "destructive" : "default"}
						borderStyle={
							variant === "destructive" ? "destructive" : "solid"
						}
						borderTone={variant === "destructive" ? "destructive" : "muted"}
						withTopHighlight={true}
						withBaseFill={true}
						baseFillClass={
							variant === "destructive" ? "bg-error-900/10" : undefined
						}
						blurClass="backdrop-blur-md"
						withAuxHairline={true}
						radiusClass="rounded-[12px]"
						zIndexClass="z-0"
					/>
						<div className="relative z-10 flex flex-col min-h-0">
							{children}
						</div>
					</DialogPrimitive.Content>
				</div>
			) : (
				<DialogPrimitive.Content
					{...props}
					data-size={size}
					className={clsx(
						"fixed left-[50%] top-[50%] translate-y-[-50%] translate-x-[-50%] z-50 overflow-hidden outline-none",
						"data-[size=default]:w-[500px] data-[size=default]:max-h-[85%]",
						"data-[size=wide]:w-[800px] data-[size=wide]:max-h-[85%]",
						"bg-transparent shadow-xl text-text",
						"p-6 rounded-[12px]",
						className,
					)}
				>
					<GlassSurfaceLayers
						radiusClass="rounded-[12px]"
						baseFillClass="bg-bg/18"
						withTopHighlight={true}
						borderStyle="solid"
						blurClass="backdrop-blur-sm"
					/>
					{children}
				</DialogPrimitive.Content>
			)}
		</DialogPortal>
	);
}

export function DialogTitle({
	children,
	className,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<DialogPrimitive.Title className={clsx("text-[14px]", className)}>
			{children}
		</DialogPrimitive.Title>
	);
}
export function DialogDescription({
	children,
	className,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<DialogPrimitive.Description
			className={clsx("text-[13px] text-text-muted", className)}
		>
			{children}
		</DialogPrimitive.Description>
	);
}

export function DialogFooter({ children }: PropsWithChildren) {
	return (
		<div
			className={clsx(
				"px-3 py-[8px] -mx-6 mt-[12px] ml-auto sticky bottom-[-4px] w-fit flex gap-x-3",
			)}
		>
			{children}
		</div>
	);
}

export function DialogHeader({
	children,
	className,
}: PropsWithChildren<{ className?: string }>) {
	return <div className={clsx("shrink-0", className)}>{children}</div>;
}

export function DialogBody({
	children,
	className,
}: PropsWithChildren<{ className?: string }>) {
	return (
		<div className={clsx("flex-1 min-h-0 overflow-y-auto", className)}>
			{children}
		</div>
	);
}
