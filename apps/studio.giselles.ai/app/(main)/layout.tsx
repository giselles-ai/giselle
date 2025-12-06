import { SentryUserWrapper } from "@/components/sentry-user-wrapper";
import { Header } from "./ui/header";
import { Sidebar } from "./ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SentryUserWrapper>
			<div className="h-screen flex flex-col bg-bg">
				<Header />
				<div className="flex overflow-y-hidden">
					<Sidebar />
					<main className="flex-1 overflow-y-auto pt-[48px] md:pt-[48px]">
						{children}
					</main>
				</div>
			</div>
		</SentryUserWrapper>
	);
}
