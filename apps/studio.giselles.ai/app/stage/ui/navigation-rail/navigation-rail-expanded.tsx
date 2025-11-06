import { ChevronsLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Suspense, use } from "react";
import { GiselleLogo } from "@/components/giselle-logo";
import { MenuButton } from "./menu-button";
import { navigationItems } from "./navigation-items";
import { NavigationList } from "./navigation-list";
import { NavigationListItem } from "./navigation-list-item";
import { NavigationRailContainer } from "./navigation-rail-container";
import { NavigationRailContentsContainer } from "./navigation-rail-contents-container";
import { NavigationRailFooter } from "./navigation-rail-footer";
import { NavigationRailFooterMenu } from "./navigation-rail-footer-menu";
import { NavigationRailHeader } from "./navigation-rail-header";
import { TeamSelectionCompact } from "./team-selection-compact";
import type { UserDataForNavigationRail } from "./types";

export function NavigationRailExpanded({
	onCollapseButtonClick,
	user: userPromise,
	teamSelectionSlot,
}: {
	onCollapseButtonClick: () => void;
	user: Promise<UserDataForNavigationRail>;
	teamSelectionSlot?: ReactNode;
}) {
	const user = use(userPromise);
	const isPro = user.currentTeam?.isPro ?? false;

	return (
		<NavigationRailContainer variant="expanded">
			<NavigationRailHeader>
				<div className="flex items-center justify-between w-full pt-6 pb-4">
					<GiselleLogo className="w-[96px] h-auto fill-stage-sidebar-text-hover" />
					<MenuButton
						onClick={() => onCollapseButtonClick()}
						className="cursor-w-resize"
					>
						<ChevronsLeftIcon className="size-5 text-stage-sidebar-text stroke-1" />
					</MenuButton>
				</div>
			</NavigationRailHeader>
			<NavigationRailContentsContainer>
				<div className="my-2 px-0 w-full">
					{teamSelectionSlot ?? (
						<TeamSelectionCompact userPromise={userPromise} />
					)}
				</div>
				<NavigationList>
					{navigationItems.map((navigationItem) => {
						if (navigationItem.type === "action" && isPro) {
							return null;
						}
						return (
							<NavigationListItem
								key={navigationItem.id}
								{...navigationItem}
								variant="expanded"
							/>
						);
					})}
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
