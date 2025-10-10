import { ToastProvider } from "@giselle-internal/ui/toast";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
	return (
		<ToastProvider>
			<div className="h-full bg-bg">{children}</div>
		</ToastProvider>
	);
}
