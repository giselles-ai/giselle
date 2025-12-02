"use client";

import { usePathname } from "next/navigation";
import { NavigationRailExpanded } from "./navigation-rail-expanded";
import type { UserDataForNavigationRail } from "./types";

export function NavigationRail({
	dataLoader,
}: {
	dataLoader: Promise<UserDataForNavigationRail>;
}) {
	const pathname = usePathname();
	return (
		<>
			<div className="hidden md:block fixed top-14 left-0 h-[calc(100vh-3.5rem)]">
				<NavigationRailExpanded
					user={dataLoader}
					currentPath={pathname}
				/>
			</div>
			<div
				data-navigation-rail-spacer
				className="border-r border-border"
				style={{ width: "var(--spacing-navigation-rail-expanded)" }}
			/>
		</>
	);
}
