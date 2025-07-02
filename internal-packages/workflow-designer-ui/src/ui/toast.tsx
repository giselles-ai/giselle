"use client";

import clsx from "clsx/lite";
import { XIcon } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useState,
} from "react";

interface Toast {
	id: string;
	message: string;
	type?: "info" | "success" | "warning" | "error";
	preserve?: boolean;
	action?: ReactNode;
}

type AddToastOption = Pick<Toast, "action">;

interface ToastContextType {
	info: (message: string, option?: AddToastOption) => void;
	error: (message: string) => void;
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

	const addToast = useCallback((toast: Omit<Toast, "id">) => {
		const id = Math.random().toString(36).substring(2);
		const newToast = {
			...toast,
			id,
		};

		setToasts((prevToasts) => [...prevToasts, newToast]);
	}, []);

	const error = useCallback(
		(message: string) => {
			addToast({ message, type: "error", preserve: true });
		},
		[addToast],
	);

	const info = useCallback(
		(message: string, option?: AddToastOption) => {
			addToast({
				message,
				type: "info",
				preserve: true,
				action: option?.action,
			});
		},
		[addToast],
	);

	return (
		<ToastContext.Provider value={{ error, info }}>
			<ToastPrimitive.Provider swipeDirection="right">
				{children}
				{toasts.map((toast) => (
					<ToastPrimitive.Root
						key={toast.id}
						className={clsx(
							"group relative rounded-[8px] backdrop-blur-[4px]",
							"data-[type=info]:bg-white-900/60",
							"data-[type=error]:bg-error-900/60",
						)}
						data-type={toast.type}
						duration={toast.preserve ? Number.POSITIVE_INFINITY : undefined}
					>
						<div
							className={clsx(
								"absolute z-0 rounded-[8px] inset-0 border-[1px] mask-fill bg-gradient-to-br bg-origin-border bg-clip-boarder border-transparent",
								"group-data-[type=info]:from-[hsl(232,_36%,_72%)]/40 to-[hsl(218,_58%,_21%)]/90",
								"group-data-[type=error]:from-[hsl(344,_23%,_76%)]/40 to-[hsl(344,_91%,_25%)]/90",
							)}
						/>
						<div className="relative text-white-900 px-[16px] py-[16px]">
							<div className="flex justify-between items-center gap-[4px]">
								<ToastPrimitive.Title className="text-[14px] flex items-center gap-[8px]">
									{toast.message}
								</ToastPrimitive.Title>
								<ToastPrimitive.Close className="rounded-[8px] hover:bg-white-900/10 p-[4px] transition-colors">
									<XIcon size={18} />
								</ToastPrimitive.Close>
							</div>
							<div>
								{toast.action && (
									<ToastPrimitive.Action altText="button" asChild>
										{toast.action}
									</ToastPrimitive.Action>
								)}
							</div>
						</div>
					</ToastPrimitive.Root>
				))}
				<ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-2147483647 m-0 flex w-[400px] max-w-[100vw] list-none flex-col gap-2.5 p-[40px] outline-hidden" />
			</ToastPrimitive.Provider>
		</ToastContext.Provider>
	);
};
