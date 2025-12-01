import { notFound } from "next/navigation";
import { Suspense } from "react";
import { dataLoader } from "@/app/stage/data-loader";
import { Header } from "@/app/stage/ui/header";
import { MobileHeader } from "@/app/stage/ui/mobile-header";
import { NavigationRail } from "@/app/stage/ui/navigation-rail";
import { stageFlag } from "@/flags";

export default async function ({ children }: { children: React.ReactNode }) {
	const enableStage = await stageFlag();
	if (!enableStage) {
		return notFound();
	}
	const data = dataLoader();
	return (
		<div className="min-h-screen flex flex-col md:flex-row bg-bg overflow-x-hidden">
			<Suspense fallback="">
				<Header dataLoader={data} />
				<MobileHeader dataLoader={data} />
				<NavigationRail dataLoader={data} />
				<div className="flex-1 min-w-0 overflow-x-hidden pt-14 md:pt-14">
					{children}
				</div>
			</Suspense>
		</div>
	);
}
