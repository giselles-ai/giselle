import { Toasts } from "@giselles-ai/components/toasts";
import { ToastProvider } from "@giselles-ai/contexts/toast";
import { LoaderCircle } from "lucide-react";
import { Suspense } from "react";
import { createAndStartTask } from "./action";
import { dataLoader } from "./data-loader";
import { Page } from "./page.client";

export default function HomePage() {
	return (
		<ToastProvider>
			<div className="min-h-screen bg-background overflow-x-hidden">
				<Suspense
					fallback={
						<div className="min-h-screen flex flex-col items-center justify-center">
							<p className="text-text text-sm mb-4">Loading...</p>
							<LoaderCircle className="w-6 h-6 text-text animate-spin" />
						</div>
					}
				>
					<Page
						dataLoader={dataLoader()}
						createAndStartTaskAction={createAndStartTask}
					/>
				</Suspense>
				<Toasts />
			</div>
		</ToastProvider>
	);
}
