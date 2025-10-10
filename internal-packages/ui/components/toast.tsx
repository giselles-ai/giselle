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
import { Button } from "./button";

interface Action {
	label?: string;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
}
interface Toast {
	id: string;
	message: string;
	type?: "info" | "success" | "warning" | "error";
	preserve?: boolean;
	action?: Action;
}

type ToastActionOptions = Pick<Toast, "action">;

type ToastOptions = ToastActionOptions & {
	id?: string;
	type?: Toast["type"];
	preserve?: boolean;
};

type ToastFn = ((message: string, options?: ToastOptions) => string) & {
	dismiss: (id?: string) => void;
};

interface ToastContextType {
	toast: ToastFn;
	info: (message: string, option?: ToastActionOptions) => void;
	error: (message: string) => void;
}

function mergeToastWithOptions(
	existing: Toast,
	message: string,
	options?: ToastOptions,
): Toast {
	return {
		...existing,
		message,
		type: options?.type ?? existing.type,
		preserve: options?.preserve ?? existing.preserve,
		action: options?.action ?? existing.action,
	};
}

function upsertToastArray(
	prev: Toast[],
	id: string,
	message: string,
	options?: ToastOptions,
): Toast[] {
	const idx = prev.findIndex((t) => t.id === id);
	if (idx === -1) {
		return [
			...prev,
			{
				id,
				message,
				type: options?.type ?? "info",
				preserve: options?.preserve ?? true,
				action: options?.action,
			},
		];
	}
	const copy = prev.slice();
	copy[idx] = mergeToastWithOptions(copy[idx], message, options);
	return copy;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToasts = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const _toast = useMemo(() => {
		const fn = ((message: string, options?: ToastOptions) => {
			const id = options?.id ?? Math.random().toString(36).substring(2);
			setToasts((prev) => upsertToastArray(prev, id, message, options));
			return id;
		}) as ToastFn;

		fn.dismiss = (id?: string) => {
			if (!id) {
				setToasts([]);
				return;
			}
			setToasts((prev) => prev.filter((t) => t.id !== id));
		};

		return fn;
	}, []);

	const error = useCallback(
		(message: string) => {
			_toast(message, { type: "error", preserve: true });
		},
		[_toast],
	);

	const info = useCallback(
		(message: string, option?: ToastActionOptions) => {
			_toast(message, {
				type: "info",
				preserve: true,
				action: option?.action,
			});
		},
		[_toast],
	);

	return (
		<ToastContext.Provider value={{ toast: _toast, info, error }}>
			<ToastPrimitive.Provider swipeDirection="right">
				{children}
				{toasts.map((toast) => (
					<ToastPrimitive.Root
						key={toast.id}
						data-type={toast.type}
						duration={toast.preserve ? Number.POSITIVE_INFINITY : undefined}
						onOpenChange={(open) => {
							if (!open) _toast.dismiss(toast.id);
						}}
						className={clsx(
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
						)}
					>
						<div className="relative px-4 py-3">
							<div className="flex justify-between items-center gap-2">
								<ToastPrimitive.Title
									className={clsx(
										"text-[14px] font-medium",
										// color tokens for types
										"group-data-[type=error]:text-[var(--color-error)]",
										"group-data-[type=warning]:text-[var(--color-warning)]",
									)}
								>
									{toast.message}
								</ToastPrimitive.Title>
								<ToastPrimitive.Close className="rounded-[8px] hover:bg-white/10 p-[4px] transition-colors">
									<XIcon size={16} />
								</ToastPrimitive.Close>
							</div>
							{toast.action && (
								<div className="mt-2">
									<ToastPrimitive.Action altText="button" asChild>
										<Button onClick={toast.action.onClick} variant="filled">
											{toast.action.label}
										</Button>
									</ToastPrimitive.Action>
								</div>
							)}
						</div>
					</ToastPrimitive.Root>
				))}
				<ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[2147483647] m-0 flex w-[360px] max-w-[100vw] list-none flex-col gap-2.5 p-6 outline-hidden" />
			</ToastPrimitive.Provider>
		</ToastContext.Provider>
	);
};
