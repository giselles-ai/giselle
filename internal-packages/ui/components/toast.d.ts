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
export declare const useToasts: () => ToastContextType;
export declare const ToastProvider: React.FC<{
	children: React.ReactNode;
}>;
//# sourceMappingURL=toast.d.ts.map
