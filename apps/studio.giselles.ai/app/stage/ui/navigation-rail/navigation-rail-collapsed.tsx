import { GiselleIcon } from "@giselle-internal/workflow-designer-ui";
import { ChevronsRightIcon } from "lucide-react";
import { Suspense, use } from "react";
import { MenuButton } from "./menu-button";
import { navigationItems } from "./navigation-items";
import { NavigationList } from "./navigation-list";
import { NavigationListItem } from "./navigation-list-item";
import { NavigationRailContainer } from "./navigation-rail-container";
import { NavigationRailContentsContainer } from "./navigation-rail-contents-container";
import { NavigationRailFooter } from "./navigation-rail-footer";
import { NavigationRailFooterMenu } from "./navigation-rail-footer-menu";
import { NavigationRailHeader } from "./navigation-rail-header";
import { TeamAvatarCompact } from "./team-avatar-compact";
import type { UserDataForNavigationRail } from "./types";

export function NavigationRailCollapsed({
	onExpandButtonClick,
	user: userPromise,
    currentPath,
}: {
	onExpandButtonClick: () => void;
	user: Promise<UserDataForNavigationRail>;
    currentPath?: string;
}) {
	const user = use(userPromise);
	const isPro = user.currentTeam?.isPro ?? false;
	return (
		<NavigationRailContainer variant="collapsed">
			<NavigationRailHeader>
				<div className="w-full pt-6 pb-4 flex justify-center">
					<MenuButton
						onClick={() => onExpandButtonClick()}
						className="group h-10 w-10 mx-auto text-stage-sidebar-text hover:text-stage-sidebar-text-hover transition-colors rounded flex items-center justify-center cursor-e-resize"
					>
						<GiselleIcon className="h-[37.11px] w-auto text-stage-sidebar-text-hover stroke-1 group-hover:hidden" />
						<ChevronsRightIcon className="size-5 text-stage-sidebar-text-hover stroke-1 hidden group-hover:block" />
					</MenuButton>
				</div>
			</NavigationRailHeader>
			<NavigationRailContentsContainer>
				<TeamAvatarCompact userPromise={userPromise} />
				<NavigationList>
					{navigationItems.map((navigationItem) => {
						if (navigationItem.type === "action" && isPro) {
							return null;
						}
                        return (
							<NavigationListItem
								key={navigationItem.id}
								{...navigationItem}
								variant="collapsed"
                                currentPath={currentPath}
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
					<NavigationRailFooterMenu user={userPromise} variant="collapsed" />
				</Suspense>
			</NavigationRailFooter>
		</NavigationRailContainer>
	);
}
