"use client";

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
						className="group relative rounded-[12px] shadow-xl"
						data-type={toast.type}
						duration={toast.preserve ? Number.POSITIVE_INFINITY : undefined}
					>
						<div
							className="absolute inset-0 -z-10 rounded-[12px] backdrop-blur-md"
							style={{
								background:
									"linear-gradient(135deg, rgba(150, 150, 150, 0.03) 0%, rgba(60, 90, 160, 0.12) 100%)",
							}}
						/>
						<div className="absolute -z-10 top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
						<div className="absolute -z-10 inset-0 rounded-[12px] border border-white/10" />
						<div className="relative text-white-900 px-[16px] py-[16px]">
							<div className="flex justify-between items-center gap-[4px]">
								<ToastPrimitive.Title className="text-[14px] flex items-center gap-[8px]">
									{toast.message}
								</ToastPrimitive.Title>
								<ToastPrimitive.Close className="rounded-[8px] hover:bg-white-900/10 p-[4px] transition-colors">
									<XIcon size={18} />
								</ToastPrimitive.Close>
							</div>
							<div className="mt-3">
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
