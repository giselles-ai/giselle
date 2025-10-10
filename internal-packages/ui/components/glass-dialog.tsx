import * as DialogPrimitive from "@radix-ui/react-dialog";
import clsx from "clsx/lite";
import { X as XIcon } from "lucide-react";

export function GlassDialogContent(
	props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
		variant?: "default" | "destructive";
	},
) {
	const { className, children, variant = "default", ...rest } = props;

	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<DialogPrimitive.Content
					className={clsx(
						"relative z-10 w-[90vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[12px] p-6",
						"shadow-xl focus:outline-none",
						className,
					)}
					{...rest}
				>
					<div
						className="absolute inset-0 -z-10 rounded-[12px] backdrop-blur-md"
						style={{
							background:
								variant === "destructive"
									? "linear-gradient(135deg, rgba(241, 91, 108, 0.03) 0%, rgba(241, 91, 108, 0.12) 100%)"
									: "linear-gradient(135deg, rgba(150, 150, 150, 0.03) 0%, rgba(60, 90, 160, 0.12) 100%)",
						}}
					/>
					<div className="absolute -z-10 top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
					<div
						className={clsx(
							"absolute -z-10 inset-0 rounded-[12px] border",
							variant === "destructive"
								? "border-error-900/10"
								: "border-border-muted",
						)}
					/>
					{children}
				</DialogPrimitive.Content>
			</div>
		</DialogPrimitive.Portal>
	);
}

export function GlassDialogHeader({
	title,
	description,
	onClose,
	variant = "default",
}: {
	title: string;
	description: string;
	onClose: () => void;
	variant?: "default" | "destructive";
}) {
	return (
		<>
			<div className="flex items-center justify-between">
				<DialogPrimitive.Title
					className={clsx(
						"font-sans text-[20px] font-medium tracking-tight",
						variant === "destructive" ? "text-error-900" : "text-white-400",
					)}
				>
					{title}
				</DialogPrimitive.Title>
				<DialogPrimitive.Close
					onClick={onClose}
					className="rounded-sm text-white-400 opacity-70 hover:opacity-100 focus:outline-none"
				>
					<XIcon className="h-5 w-5" />
					<span className="sr-only">Close</span>
				</DialogPrimitive.Close>
			</div>
			<DialogPrimitive.Description
				className={clsx(
					"font-geist mt-2 text-[14px]",
					variant === "destructive" ? "text-error-900/50" : "text-black-400",
				)}
			>
				{description}
			</DialogPrimitive.Description>
		</>
	);
}

export function GlassDialogFooter({
	onCancel,
	onConfirm,
	confirmLabel,
	isPending = false,
	variant = "default",
}: {
	onCancel: () => void;
	onConfirm?: () => void;
	confirmLabel: string;
	isPending?: boolean;
	variant?: "default" | "destructive";
}) {
	const baseBtn = clsx(
		"relative inline-flex items-center justify-center",
		"rounded-lg border-t border-b border-t-white/20 border-b-black/20",
		"px-6 py-2 text-sm font-medium",
		"shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.08)]",
		"transition-all duration-300 hover:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_-1px_0_rgba(0,0,0,0.2)_inset,0_0_0_1px_rgba(255,255,255,0.1)]",
	);

	const linkBtn = clsx(
		baseBtn,
		"text-white",
		"bg-black/20 border border-white/10",
		"shadow-[inset_0_0_4px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_0_6px_rgba(0,0,0,0.6)]",
	);
	const primaryBtn = clsx(
		baseBtn,
		"text-white/80 bg-gradient-to-b from-[#202530] to-[#12151f]",
		"border border-[rgba(0,0,0,0.7)]",
		"shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)]",
		"active:scale-[0.98]",
	);
	const destructiveBtn = clsx(
		baseBtn,
		"text-error-900 bg-gradient-to-b from-error-900/15 to-error-900/5",
		"border border-error-900/80",
		"shadow-[inset_0_1px_0_0_#F15B6C40,inset_0_-1px_0_0_rgba(0,0,0,0.2),0_0_8px_0_#F15B6C60]",
		"hover:from-error-900/25 hover:to-error-900/10 hover:border-error-900 hover:shadow-[inset_0_1px_0_0_#F15B6C50,inset_0_-1px_0_0_rgba(0,0,0,0.2),0_0_12px_0_#F15B6C80]",
	);
	return (
		<div className="mt-6 flex justify-end gap-x-3">
			<button
				type="button"
				onClick={onCancel}
				disabled={isPending}
				className={linkBtn}
			>
				Cancel
			</button>
			<button
				type="button"
				onClick={onConfirm}
				disabled={isPending}
				className={variant === "destructive" ? destructiveBtn : primaryBtn}
			>
				{isPending ? "Processing..." : confirmLabel}
			</button>
		</div>
	);
}

export function GlassDialogBody({ children }: { children: React.ReactNode }) {
	return <div className="mt-4">{children}</div>;
}
