import type { ReactNode } from "react";
import { Suspense } from "react";
import { dataLoader } from "@/app/stage/data-loader";
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
					<MobileHeader
						dataLoader={user}
						teamSelectionSlot={<TeamSelection />}
					/>
					<NavigationRail
						dataLoader={user}
						teamSelectionSlot={<TeamSelection />}
					/>
				</Suspense>
				<main className="flex-1 overflow-y-auto">{children}</main>
			</div>
		</SentryUserWrapper>
	);
}
