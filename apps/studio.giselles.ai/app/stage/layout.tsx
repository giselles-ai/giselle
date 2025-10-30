import { type ReactNode, Suspense } from "react";
import { dataLoader } from "./data-loader";
import { MobileHeader } from "./ui/mobile-header";
import { NavigationRail } from "./ui/navigation-rail";

export default function StageLayout({ children }: { children: ReactNode }) {
	const data = dataLoader();
	return (
		<div className="min-h-screen flex flex-col md:flex-row bg-bg">
			<Suspense fallback="">
				<MobileHeader />
				<NavigationRail dataLoader={data} />
			</Suspense>
			<div className="flex-1">{children}</div>
		</div>
	);
}
