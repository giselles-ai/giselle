import * as DialogPrimitive from "@radix-ui/react-dialog";
import clsx from "clsx/lite";
import { X as XIcon } from "lucide-react";
import {
	Fragment as _Fragment,
	jsx as _jsx,
	jsxs as _jsxs,
} from "react/jsx-runtime";
import { GlassSurfaceLayers } from "./glass-surface";
export function GlassDialogContent(props) {
	const { className, children, variant = "default", ...rest } = props;
	return _jsxs(DialogPrimitive.Portal, {
		children: [
			_jsx(DialogPrimitive.Overlay, {
				className: "fixed inset-0 z-50 bg-black/60",
			}),
			_jsx("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center p-4",
				children: _jsxs(DialogPrimitive.Content, {
					className: clsx(
						"relative z-10 w-[90vw] max-w-[500px] max-h-[90vh] overflow-y-auto rounded-[12px] p-6",
						"shadow-xl focus:outline-none",
						className,
					),
					...rest,
					children: [
						_jsx(GlassSurfaceLayers, {
							variant: variant === "destructive" ? "destructive" : "default",
							borderStyle: "solid",
							withTopHighlight: true,
							withBaseFill: true,
						}),
						children,
					],
				}),
			}),
		],
	});
}
export function GlassDialogHeader({
	title,
	description,
	onClose,
	variant = "default",
}) {
	return _jsxs(_Fragment, {
		children: [
			_jsxs("div", {
				className: "flex items-center justify-between",
				children: [
					_jsx(DialogPrimitive.Title, {
						className: clsx(
							"font-sans text-[20px] font-medium tracking-tight",
							variant === "destructive" ? "text-error-900" : "text-white-400",
						),
						children: title,
					}),
					_jsxs(DialogPrimitive.Close, {
						onClick: onClose,
						className:
							"rounded-sm text-white-400 opacity-70 hover:opacity-100 focus:outline-none",
						children: [
							_jsx(XIcon, { className: "h-5 w-5" }),
							_jsx("span", { className: "sr-only", children: "Close" }),
						],
					}),
				],
			}),
			_jsx(DialogPrimitive.Description, {
				className: clsx(
					"font-geist mt-2 text-[14px]",
					variant === "destructive" ? "text-error-900/50" : "text-black-400",
				),
				children: description,
			}),
		],
	});
}
export function GlassDialogFooter({
	onCancel,
	onConfirm,
	confirmLabel,
	isPending = false,
	isConfirmDisabled = false,
	variant = "default",
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
	return _jsxs("div", {
		className: "mt-6 flex justify-end gap-x-3",
		children: [
			_jsx("button", {
				type: "button",
				onClick: onCancel,
				disabled: isPending,
				className: linkBtn,
				children: "Cancel",
			}),
			_jsx("button", {
				type: "button",
				onClick: onConfirm,
				disabled: isPending || isConfirmDisabled,
				className: variant === "destructive" ? destructiveBtn : primaryBtn,
				children: isPending ? "Processing..." : confirmLabel,
			}),
		],
	});
}
export function GlassDialogBody({ children }) {
	return _jsx("div", { className: "mt-4", children: children });
}
//# sourceMappingURL=glass-dialog.js.map
