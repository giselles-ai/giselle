import { ToastProvider } from "@giselle-internal/ui/toast";
import { SentryUserWrapper } from "@/components/sentry-user-wrapper";
import { InternalGiselleClientProvider } from "./internal-giselle-client-provider";
import { Header } from "./ui/header";
import { Sidebar } from "./ui/sidebar";
import { TaskOverlay } from "./ui/task-overlay";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SentryUserWrapper>
			<ToastProvider>
				<InternalGiselleClientProvider>
					<div className="h-screen flex flex-col bg-bg">
						<Header />
						<div className="flex overflow-y-hidden divide-x divide-border flex-1">
							<Sidebar />
							<main className="flex-1 overflow-y-auto relative">
								{children}
								<TaskOverlay />
							</main>
						</div>
					</div>
				</InternalGiselleClientProvider>
			</ToastProvider>
		</SentryUserWrapper>
	);
}
