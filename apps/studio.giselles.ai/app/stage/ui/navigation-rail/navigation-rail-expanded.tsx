import { GiselleIcon } from "@giselle-internal/workflow-designer-ui";

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
import { SimpleChevronLeft } from "./simple-chevron-icons";
import type { UserDataForNavigationRail } from "./types";

export function NavigationRailExpanded({
	onCollapseButtonClick,
	user: userPromise,
}: {
	onCollapseButtonClick: () => void;
	user: Promise<UserDataForNavigationRail>;
}) {
	return (
		<NavigationRailContainer variant="expanded">
			<NavigationRailHeader>
				<div className="flex items-center justify-start w-full">
					<div className="group size-8 flex justify-center items-center">
						<GiselleIcon className="size-6 text-[var(--color-stage-sidebar-text-hover)] stroke-1 group-hover:hidden shrink-0" />
					</div>
					<p className="text-[var(--color-stage-sidebar-text-hover)] text-[13px] font-semibold">
						Stage
					</p>
				</div>
				<div className="absolute right-3 top-1.5">
					<MenuButton
						onClick={() => onCollapseButtonClick()}
						className="cursor-w-resize"
					>
						<SimpleChevronLeft className="size-5 text-[var(--color-stage-sidebar-text)]" />
					</MenuButton>
				</div>
			</NavigationRailHeader>
			<NavigationRailContentsContainer>
				<NavigationList>
					{navigationItems.map((navigationItem) => (
						<NavigationListItem
							key={navigationItem.id}
							{...navigationItem}
							variant="expanded"
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
					<NavigationRailFooterMenu user={userPromise} variant="expanded" />
				</Suspense>
			</NavigationRailFooter>
		</NavigationRailContainer>
	);
}
