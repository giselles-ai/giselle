"use client";

import { useToasts } from "@giselle-internal/ui/toast";
import { useMemo } from "react";

interface Toast {
	id: string;
	title?: string;
	message?: string;
	type?: "info" | "success" | "warning" | "error";
	duration?: number;
}

interface ToastContextType {
	toasts: Toast[];
	addToast: (toast: Omit<Toast, "id">) => void;
	removeToast: (id: string) => void;
}

export const useToast = () => {
	const { toast } = useToasts();

	return useMemo<ToastContextType>(() => {
		return {
			// Studio now uses the shared `/ui` toast implementation, which renders
			// the viewport/UI internally. Keep `toasts` empty for legacy callers.
			toasts: [],
			addToast: (legacy) => {
				const message =
					legacy.message ?? (legacy.title ? `${legacy.title}` : "") ?? "";

				const id = toast(message, {
					type: legacy.type ?? "info",
					preserve: false,
				});

				const durationMs = legacy.duration ?? 10000;
				window.setTimeout(() => {
					toast.dismiss(id);
				}, durationMs);
			},
			removeToast: (id) => {
				toast.dismiss(id);
			},
		};
	}, [toast]);
};

export { ToastProvider, useToasts } from "@giselle-internal/ui/toast";
