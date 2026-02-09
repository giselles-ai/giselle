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

interface Action {
	label?: string;
	onClick?: React.MouseEventHandler<HTMLButtonElement>;
}
interface Toast {
	id: string;
	message: string;
	title?: string;
	type?: "info" | "success" | "warning" | "error";
	preserve?: boolean;
	action?: Action;
}

type ToastActionOptions = Pick<Toast, "action">;

type ToastOptions = ToastActionOptions & {
	id?: string;
	type?: Toast["type"];
	preserve?: boolean;
	title?: string;
};

type ToastFn = ((message: string, options?: ToastOptions) => string) & {
	dismiss: (id?: string) => void;
};

interface ToastContextType {
	toast: ToastFn;
	info: (
		message: string,
		option?: ToastActionOptions & { title?: string },
	) => void;
	error: (message: string, option?: { title?: string }) => void;
}

function mergeToastWithOptions(
	existing: Toast,
	message: string,
	options?: ToastOptions,
): Toast {
	return {
		...existing,
		message,
		title: options?.title ?? existing.title,
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
				title: options?.title,
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
		(message: string, option?: { title?: string }) => {
			_toast(message, { type: "error", preserve: true, title: option?.title });
		},
		[_toast],
	);

	const info = useCallback(
		(message: string, option?: ToastActionOptions & { title?: string }) => {
			_toast(message, {
				type: "info",
				preserve: true,
				action: option?.action,
				title: option?.title,
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
							"data-[type=info]:bg-linear-to-b data-[type=info]:from-[color:var(--color-info)]/18 data-[type=info]:via-[color:var(--color-info)]/12 data-[type=info]:to-[color:var(--color-info)]/8",
							"data-[type=success]:bg-linear-to-b data-[type=success]:from-[color:var(--color-success)]/18 data-[type=success]:via-[color:var(--color-success)]/12 data-[type=success]:to-[color:var(--color-success)]/8",
							"data-[type=warning]:bg-linear-to-b data-[type=warning]:from-[color:var(--color-warning)]/30 data-[type=warning]:via-[color:var(--color-warning)]/20 data-[type=warning]:to-[color:var(--color-warning)]/12",
							"data-[type=error]:bg-linear-to-b data-[type=error]:from-[color:var(--color-error)]/18 data-[type=error]:via-[color:var(--color-error)]/12 data-[type=error]:to-[color:var(--color-error)]/8",
							// border/ring
							"border-[0.5px] border-white/15 ring-1 ring-inset ring-inverse/10",
							"data-[type=info]:ring-[color:var(--color-info)]/25 data-[type=success]:ring-[color:var(--color-success)]/25 data-[type=warning]:ring-[color:var(--color-warning)]/25 data-[type=error]:ring-[color:var(--color-error)]/30",
							"shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]",
						)}
					>
						<div className="relative px-4 py-3">
							<div className="flex justify-between items-start gap-2">
								<div className="flex-1 min-w-0">
									{toast.title ? (
										<>
											<ToastPrimitive.Title
												className={clsx(
													"text-[14px] font-medium mb-1",
													// color tokens for types
													"group-data-[type=info]:text-[color:var(--color-info)]",
													"group-data-[type=success]:text-[color:var(--color-success)]",
													"group-data-[type=warning]:text-[color:var(--color-warning)]",
													"group-data-[type=error]:text-[color:var(--color-error)]",
												)}
											>
												{toast.title}
											</ToastPrimitive.Title>
											<ToastPrimitive.Description
												className={clsx(
													"text-[13px]",
													// color tokens for types (same as title but slightly lighter)
													"group-data-[type=info]:text-[color:var(--color-info)]/70",
													"group-data-[type=success]:text-[color:var(--color-success)]/70",
													"group-data-[type=warning]:text-[color:var(--color-warning)]/70",
													"group-data-[type=error]:text-[color:var(--color-error)]/70",
												)}
											>
												{toast.message}
											</ToastPrimitive.Description>
										</>
									) : (
										<ToastPrimitive.Title
											className={clsx(
												"text-[14px] font-medium",
												// color tokens for types
												"group-data-[type=info]:text-[color:var(--color-info)]",
												"group-data-[type=success]:text-[color:var(--color-success)]",
												"group-data-[type=warning]:text-[color:var(--color-warning)]",
												"group-data-[type=error]:text-[color:var(--color-error)]",
											)}
										>
											{toast.message}
										</ToastPrimitive.Title>
									)}
								</div>
								<ToastPrimitive.Close
									className={clsx(
										"rounded-[8px] hover:bg-white/10 p-[4px] transition-colors flex-shrink-0",
										"text-white/70",
										"group-data-[type=info]:text-[color:var(--color-info)]/80",
										"group-data-[type=success]:text-[color:var(--color-success)]/80",
										"group-data-[type=warning]:text-[color:var(--color-warning)]/80",
										"group-data-[type=error]:text-[color:var(--color-error)]/80",
									)}
								>
									<XIcon size={16} />
								</ToastPrimitive.Close>
							</div>
							{toast.action && (
								<div className="flex justify-end mt-2">
									<ToastPrimitive.Action altText="button" asChild>
										<button
											type="button"
											onClick={toast.action.onClick}
											className={clsx(
												"px-[8px] py-[2px] rounded-[3px] text-[12px] font-medium border cursor-pointer transition-colors",
												"enabled:hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
												// StatusBadge style by type
												"group-data-[type=info]:bg-[rgba(var(--color-info-rgb),0.05)] group-data-[type=info]:text-[color:var(--color-info)] group-data-[type=info]:border-[rgba(var(--color-info-rgb),0.1)]",
												"group-data-[type=success]:bg-[rgba(var(--color-success-rgb),0.05)] group-data-[type=success]:text-[color:var(--color-success)] group-data-[type=success]:border-[rgba(var(--color-success-rgb),0.1)]",
												"group-data-[type=warning]:bg-[rgba(var(--color-warning-rgb),0.05)] group-data-[type=warning]:text-[color:var(--color-warning)] group-data-[type=warning]:border-[rgba(var(--color-warning-rgb),0.1)]",
												"group-data-[type=error]:bg-[rgba(var(--color-error-rgb),0.05)] group-data-[type=error]:text-[color:var(--color-error)] group-data-[type=error]:border-[rgba(var(--color-error-rgb),0.1)]",
											)}
										>
											{toast.action.label}
										</button>
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
