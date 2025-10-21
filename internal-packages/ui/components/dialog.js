import clsx from "clsx/lite";
import { Dialog as DialogPrimitive } from "radix-ui";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GlassSurfaceLayers } from "./glass-surface";
export const Dialog = DialogPrimitive.Root;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogTrigger = DialogPrimitive.Trigger;
export function DialogContent({ children, size = "default" }) {
	return _jsxs(DialogPortal, {
		children: [
			_jsx(DialogPrimitive.Overlay, {
				className: "fixed inset-0 bg-black/60 z-50",
			}),
			_jsxs(DialogPrimitive.Content, {
				"data-size": size,
				className: clsx(
					"fixed left-[50%] top-[50%] translate-y-[-50%] translate-x-[-50%] z-50 overflow-y-auto overflow-x-hidden outline-none",
					"data-[size=default]:w-[500px] data-[size=default]:max-h-[75%]",
					"data-[size=wide]:w-[800px] data-[size=default]:max-h-[85%]",
					"relative bg-transparent shadow-xl text-text",
					"p-6 rounded-[12px]",
				),
				children: [
					_jsx(GlassSurfaceLayers, {
						radiusClass: "rounded-[12px]",
						baseFillClass: "bg-bg/18",
						withTopHighlight: false,
						borderStyle: "solid",
						blurClass: "backdrop-blur-sm",
					}),
					children,
				],
			}),
		],
	});
}
export function DialogTitle({ children, className }) {
	return _jsx(DialogPrimitive.Title, {
		className: clsx("text-[14px]", className),
		children: children,
	});
}
export function DialogDescription({ children, className }) {
	return _jsx(DialogPrimitive.Description, {
		className: clsx("text-[13px] text-text-muted", className),
		children: children,
	});
}
export function DialogFooter({ children }) {
	return _jsx("div", {
		className: clsx(
			"px-3 py-[8px] -mx-6 mt-[12px] ml-auto sticky bottom-0 w-fit",
		),
		children: children,
	});
}
//# sourceMappingURL=dialog.js.map
