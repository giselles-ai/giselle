import type { ActId } from "@giselle-sdk/giselle";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSidebarDataObject } from "./lib/data";
import { NavSkelton } from "./ui/nav-skelton";
import { Sidebar } from "./ui/sidebar";
import "./mobile-scroll.css";

function isValidActId(actId: string): actId is ActId {
	return actId.startsWith("act-") && actId.length === 20; // "act-" + 16 chars
}

export default async function ({
	children,
	params,
}: React.PropsWithChildren<{
	params: Promise<{ actId: string }>;
}>) {
	const { actId: actIdParam } = await params;

	// Validate actId parameter
	if (!isValidActId(actIdParam)) {
		notFound();
	}
	const actId: ActId = actIdParam;
	const data = getSidebarDataObject(actId);

	return (
		<div className="bg-[var(--color-stage-background)] text-foreground min-h-screen md:h-screen md:flex md:flex-row font-sans">
			{/* Left Sidebar - Always visible */}
			<div className="w-full md:w-auto md:h-screen md:overflow-y-auto">
				<Suspense fallback={<NavSkelton />}>
					<Sidebar data={data} />
				</Suspense>
			</div>

			{/* Main Content - Hidden on mobile */}
			<main className="hidden md:flex m-0 md:m-[8px] flex-1 rounded-none md:rounded-[12px] backdrop-blur-md border-0 md:border md:border-border shadow-lg shadow-black/10 shadow-inner overflow-hidden">
				{children}
			</main>
		</div>
	);
}
