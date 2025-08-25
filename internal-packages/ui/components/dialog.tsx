import clsx from "clsx/lite";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { PropsWithChildren } from "react";

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
			<DialogPrimitive.Overlay className="fixed inset-0 bg-black/60 z-[9999]" />
			<DialogPrimitive.Content
				data-size={size}
				className={clsx(
					"fixed left-[50%] top-[50%] translate-y-[-50%] translate-x-[-50%] z-[10000] overflow-y-auto overflow-x-hidden outline-none",
					"data-[size=default]:w-[500px] data-[size=default]:max-h-[75%]",
					"data-[size=wide]:w-[800px] data-[size=default]:max-h-[85%]",
					"bg-(image:--glass-bg)",
					"border border-glass-border/20 shadow-xl text-text",
					"p-6 rounded-[12px]",
					"backdrop-blur-md",
					"after:absolute after:bg-(image:--glass-highlight-bg) after:left-4 after:right-4 after:h-px after:top-0",
				)}
			>
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
