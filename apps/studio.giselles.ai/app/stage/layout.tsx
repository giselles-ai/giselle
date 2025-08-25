import { type ReactNode, Suspense } from "react";
import { getSidebarData } from "./query";
import { MobileHeader } from "./ui/mobile-header";
import { NavigationRail } from "./ui/navigation-rail";

export default function StageLayout({ children }: { children: ReactNode }) {
	const data = getSidebarData();
	return (
		<div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-stage-background)]">
			<Suspense fallback="">
				<MobileHeader />
				<NavigationRail user={data} />
			</Suspense>
			<div className="flex-1">{children}</div>
		</div>
	);
}
