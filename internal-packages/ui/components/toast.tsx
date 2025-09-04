"use client";

import clsx from "clsx/lite";
import { XIcon } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import {
	createContext,
	useCallback,
	useContext,
	useRef,
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

type AddToastOption = Pick<Toast, "action">;

interface ToastContextType {
	info: (message: string, option?: AddToastOption) => void;
	error: (message: string) => void;
	progress: {
		start: (key: string, message: string, option?: AddToastOption) => void;
		finish: (key: string) => void;
	};
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
	const keyMapRef = useRef<Record<string, string>>({});

	const addToast = useCallback((toast: Omit<Toast, "id">) => {
		const id = Math.random().toString(36).substring(2);
		const newToast = {
			...toast,
			id,
		};

		setToasts((prevToasts) => [...prevToasts, newToast]);
		return id;
	}, []);

	const closeToastById = useCallback((id: string) => {
		setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
	}, []);

	const startProgress = useCallback(
		(key: string, message: string, option?: AddToastOption) => {
			const existingId = keyMapRef.current[key];
			if (existingId) {
				setToasts((prevToasts) =>
					prevToasts.filter((t) => t.id !== existingId),
				);
			}
			const id = addToast({
				message,
				type: "info",
				preserve: true,
				action: option?.action,
			});
			keyMapRef.current[key] = id;
		},
		[addToast],
	);

	const finishProgress = useCallback((key: string) => {
		const id = keyMapRef.current[key];
		if (id) {
			setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
			delete keyMapRef.current[key];
		}
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
		<ToastContext.Provider
			value={{
				error,
				info,
				progress: { start: startProgress, finish: finishProgress },
			}}
		>
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
						onOpenChange={(open) => {
							if (!open) closeToastById(toast.id);
						}}
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
										<Button onClick={toast.action.onClick} variant="filled">
											{toast.action.label}
										</Button>
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
