import { type ReactNode, Suspense } from "react";
import { dataLoader } from "./data-loader";
import { Header } from "./ui/header";
import { MobileHeader } from "./ui/mobile-header";
import { NavigationRail } from "./ui/navigation-rail";

export default function StageLayout({ children }: { children: ReactNode }) {
	const data = dataLoader();
	return (
		<div className="min-h-screen flex flex-col md:flex-row bg-bg">
			<Suspense fallback="">
				<Header dataLoader={data} />
				<MobileHeader dataLoader={data} />
				<NavigationRail dataLoader={data} />
			</Suspense>
			<div className="flex-1 pt-14 md:pt-14">{children}</div>
		</div>
	);
}
