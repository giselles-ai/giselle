import { type ReactNode, Suspense } from "react";
import { getSidebarData } from "./query";
import { MobileBottomNavigation } from "./ui/mobile-bottom-navigation";
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
			<div className="flex-1 pb-16 md:pb-0">{children}</div>
			<Suspense fallback="">
				<MobileBottomNavigation user={data} />
			</Suspense>
		</div>
	);
}
