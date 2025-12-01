import { ChevronsRightIcon } from "lucide-react";
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
	currentPath,
}: {
	onExpandButtonClick: () => void;
	user: Promise<UserDataForNavigationRail>;
	currentPath?: string;
}) {
	return (
		<NavigationRailContainer variant="collapsed">
			<NavigationRailHeader>
				<div className="w-full pt-6 pb-4 flex justify-center">
					<MenuButton
						onClick={() => onExpandButtonClick()}
						className="h-10 w-10 mx-auto text-link-muted hover:text-accent transition-colors rounded flex items-center justify-center cursor-e-resize"
					>
						<ChevronsRightIcon className="size-5 text-link-muted stroke-1" />
					</MenuButton>
				</div>
			</NavigationRailHeader>
			<NavigationRailContentsContainer>
				<NavigationList>
					{navigationItems.map((navigationItem) => {
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
