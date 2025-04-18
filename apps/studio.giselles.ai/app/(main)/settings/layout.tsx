import { ToastProvider } from "@/packages/contexts/toast";
import type { ReactNode } from "react";

export default async function Layout({ children }: { children: ReactNode }) {
	return (
		<ToastProvider>
			<div className="h-full bg-black-900">{children}</div>
		</ToastProvider>
	);
}
