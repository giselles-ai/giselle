import type { ReactNode } from "react";
import { Suspense } from "react";
import { dataLoader } from "@/app/stage/data-loader";
import { Header } from "@/app/stage/ui/header";
import { MobileHeader } from "@/app/stage/ui/mobile-header";
import { NavigationRail } from "@/app/stage/ui/navigation-rail";
import { SentryUserWrapper } from "@/components/sentry-user-wrapper";
import { TeamSelection } from "@/services/teams/components/team-selection";

export default function Layout({ children }: { children: ReactNode }) {
	const user = dataLoader();
	return (
		<SentryUserWrapper>
			<div className="min-h-screen flex flex-col md:flex-row bg-bg">
				<Suspense fallback="">
					<Header dataLoader={user} />
					<MobileHeader
						dataLoader={user}
						teamSelectionSlot={<TeamSelection />}
					/>
					<NavigationRail dataLoader={user} />
				</Suspense>
				<main className="flex-1 overflow-y-auto pt-14 md:pt-14">
					{children}
				</main>
			</div>
		</SentryUserWrapper>
	);
}
