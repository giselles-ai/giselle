import clsx from "clsx/lite";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { PropsWithChildren } from "react";
import { GlassSurfaceLayers } from "./glass-surface";

export const Dialog = DialogPrimitive.Root;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogTrigger = DialogPrimitive.Trigger;

export type DialogSize = "default" | "wide";
export function DialogContent({
	children,
	size = "default",
}: PropsWithChildren<{ size?: DialogSize }>) {
	return (
		<DialogPortal>
			<DialogPrimitive.Overlay className="fixed inset-0 bg-black/60 z-50" />
			<DialogPrimitive.Content
				data-size={size}
				className={clsx(
					"fixed left-[50%] top-[50%] translate-y-[-50%] translate-x-[-50%] z-50 overflow-y-auto overflow-x-hidden outline-none",
					"data-[size=default]:w-[500px] data-[size=default]:max-h-[75%]",
					"data-[size=wide]:w-[800px] data-[size=default]:max-h-[85%]",
					"bg-transparent shadow-xl text-text",
					"p-6 rounded-[12px]",
				)}
			>
				<GlassSurfaceLayers
					radiusClass="rounded-[12px]"
					baseFillClass="bg-bg/18"
					withTopHighlight={false}
					borderStyle="solid"
					blurClass="backdrop-blur-sm"
				/>
				{children}
			</DialogPrimitive.Content>
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
				"px-3 py-[8px] -mx-6 mt-[12px] ml-auto sticky bottom-0 w-fit",
			)}
		>
			{children}
		</div>
	);
}
