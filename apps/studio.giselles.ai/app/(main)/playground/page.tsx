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
							<p
								className="text-[16px] font-sans font-medium text-[hsl(192,73%,84%)] mb-4"
								style={{
									textShadow:
										"0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
								}}
							>
								Loading...
							</p>
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
