"use client";
import clsx from "clsx/lite";
import { XIcon } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "./button";

function mergeToastWithOptions(existing, message, options) {
	var _a, _b, _c;
	return {
		...existing,
		message,
		type:
			(_a = options === null || options === void 0 ? void 0 : options.type) !==
				null && _a !== void 0
				? _a
				: existing.type,
		preserve:
			(_b =
				options === null || options === void 0 ? void 0 : options.preserve) !==
				null && _b !== void 0
				? _b
				: existing.preserve,
		action:
			(_c =
				options === null || options === void 0 ? void 0 : options.action) !==
				null && _c !== void 0
				? _c
				: existing.action,
	};
}
function upsertToastArray(prev, id, message, options) {
	var _a, _b;
	const idx = prev.findIndex((t) => t.id === id);
	if (idx === -1) {
		return [
			...prev,
			{
				id,
				message,
				type:
					(_a =
						options === null || options === void 0 ? void 0 : options.type) !==
						null && _a !== void 0
						? _a
						: "info",
				preserve:
					(_b =
						options === null || options === void 0
							? void 0
							: options.preserve) !== null && _b !== void 0
						? _b
						: true,
				action:
					options === null || options === void 0 ? void 0 : options.action,
			},
		];
	}
	const copy = prev.slice();
	copy[idx] = mergeToastWithOptions(copy[idx], message, options);
	return copy;
}
const ToastContext = createContext(undefined);
export const useToasts = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
};
export const ToastProvider = ({ children }) => {
	const [toasts, setToasts] = useState([]);
	const _toast = useMemo(() => {
		const fn = (message, options) => {
			var _a;
			const id =
				(_a = options === null || options === void 0 ? void 0 : options.id) !==
					null && _a !== void 0
					? _a
					: Math.random().toString(36).substring(2);
			setToasts((prev) => upsertToastArray(prev, id, message, options));
			return id;
		};
		fn.dismiss = (id) => {
			if (!id) {
				setToasts([]);
				return;
			}
			setToasts((prev) => prev.filter((t) => t.id !== id));
		};
		return fn;
	}, []);
	const error = useCallback(
		(message) => {
			_toast(message, { type: "error", preserve: true });
		},
		[_toast],
	);
	const info = useCallback(
		(message, option) => {
			_toast(message, {
				type: "info",
				preserve: true,
				action: option === null || option === void 0 ? void 0 : option.action,
			});
		},
		[_toast],
	);
	return _jsx(ToastContext.Provider, {
		value: { toast: _toast, info, error },
		children: _jsxs(ToastPrimitive.Provider, {
			swipeDirection: "right",
			children: [
				children,
				toasts.map((toast) =>
					_jsx(
						ToastPrimitive.Root,
						{
							"data-type": toast.type,
							duration: toast.preserve ? Number.POSITIVE_INFINITY : undefined,
							onOpenChange: (open) => {
								if (!open) _toast.dismiss(toast.id);
							},
							className: clsx(
								// container
								"group relative rounded-[12px] backdrop-blur-md text-white/90",
								// glass gradient + border by type
								"data-[type=info]:bg-linear-to-b data-[type=info]:from-[#232a3c]/60 data-[type=info]:to-[#0f1422]/90",
								// success matches info styling
								"data-[type=success]:bg-linear-to-b data-[type=success]:from-[#232a3c]/60 data-[type=success]:to-[#0f1422]/90",
								// warning/error tinted by tokens
								"data-[type=warning]:bg-linear-to-b data-[type=warning]:from-[color:var(--color-warning)]/18 data-[type=warning]:to-[#0f1422]/90",
								"data-[type=error]:bg-linear-to-b data-[type=error]:from-[color:var(--color-error)]/18 data-[type=error]:to-[#1b0a0d]/90",
								// border/ring
								"border border-white/15 ring-1 ring-inset ring-white/10",
								"group-data-[type=warning]:ring-[color:var(--color-warning)]/25 group-data-[type=error]:ring-[color:var(--color-error)]/30",
								"shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]",
							),
							children: _jsxs("div", {
								className: "relative px-4 py-3",
								children: [
									_jsxs("div", {
										className: "flex justify-between items-center gap-2",
										children: [
											_jsx(ToastPrimitive.Title, {
												className: clsx(
													"text-[14px] font-medium",
													// color tokens for types
													"group-data-[type=error]:text-[var(--color-error)]",
													"group-data-[type=warning]:text-[var(--color-warning)]",
												),
												children: toast.message,
											}),
											_jsx(ToastPrimitive.Close, {
												className:
													"rounded-[8px] hover:bg-white/10 p-[4px] transition-colors",
												children: _jsx(XIcon, { size: 16 }),
											}),
										],
									}),
									toast.action &&
										_jsx("div", {
											className: "mt-2",
											children: _jsx(ToastPrimitive.Action, {
												altText: "button",
												asChild: true,
												children: _jsx(Button, {
													onClick: toast.action.onClick,
													variant: "filled",
													children: toast.action.label,
												}),
											}),
										}),
								],
							}),
						},
						toast.id,
					),
				),
				_jsx(ToastPrimitive.Viewport, {
					className:
						"fixed bottom-0 right-0 z-[2147483647] m-0 flex w-[360px] max-w-[100vw] list-none flex-col gap-2.5 p-6 outline-hidden",
				}),
			],
		}),
	});
};
//# sourceMappingURL=toast.js.map
