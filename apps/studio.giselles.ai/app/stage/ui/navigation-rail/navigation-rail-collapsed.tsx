import { GiselleIcon } from "@giselle-internal/workflow-designer-ui";
import { PanelLeftOpenIcon } from "lucide-react";
import { Suspense } from "react";
import { MenuButton } from "./menu-button";
import { navigationItems } from "./navigation-items";
import { NavigationList } from "./navigation-list";
import { NavigationListItem } from "./navigation-list-item";
import { NavigationRailContainer } from "./navigation-rail-container";
import { NavigationRailContentsContainer } from "./navigation-rail-contents-container";
import { NavigationRailFooter } from "./navigation-rail-footer";
import { NavigationRailFooterMenu } from "./navigation-rail-footer-menu";
import { NavigationRailHeader } from "./navigation-rail-header";
import type { UserDataForNavigationRail } from "./types";

export function NavigationRailCollapsed({
	onExpandButtonClick,
	user: userPromise,
}: {
	onExpandButtonClick: () => void;
	user: Promise<UserDataForNavigationRail>;
}) {
	return (
		<NavigationRailContainer variant="collapsed">
			<NavigationRailHeader>
				<MenuButton
					onClick={() => onExpandButtonClick()}
					className="cursor-e-resize"
				>
					<GiselleIcon className="size-6 text-[var(--color-stage-sidebar-text-hover)] stroke-1 group-hover:hidden" />
					<PanelLeftOpenIcon className="size-6 text-[var(--color-stage-sidebar-text)] stroke-1 hidden group-hover:block" />
				</MenuButton>
			</NavigationRailHeader>
			<NavigationRailContentsContainer>
				<NavigationList>
					{navigationItems.map((navigationItem) => (
						<NavigationListItem
							key={navigationItem.id}
							{...navigationItem}
							variant="collapsed"
						/>
					))}
				</NavigationList>
			</NavigationRailContentsContainer>

			<NavigationRailFooter>
				<Suspense
					fallback={
						<div className="w-full bg-black-800 animate-pulse h-full rounded-md" />
					}
				>
					<NavigationRailFooterMenu user={userPromise} variant="collapsed" />
				</Suspense>
			</NavigationRailFooter>
		</NavigationRailContainer>
	);
}
