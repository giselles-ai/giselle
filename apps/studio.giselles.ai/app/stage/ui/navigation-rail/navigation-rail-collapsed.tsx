import { ChevronsRightIcon } from "lucide-react";
import { MenuButton } from "./menu-button";
import { navigationItems, navigationItemsFooter } from "./navigation-items";
import { NavigationList } from "./navigation-list";
import { NavigationListItem } from "./navigation-list-item";
import { NavigationRailContainer } from "./navigation-rail-container";
import { NavigationRailContentsContainer } from "./navigation-rail-contents-container";
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
				<div className="w-full flex justify-center">
					<MenuButton
						onClick={() => onExpandButtonClick()}
						className="h-8 w-8 mx-auto text-link-muted hover:text-accent transition-colors rounded flex items-center justify-center cursor-e-resize"
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
				{/* Footer items */}
				<div className="mt-auto pt-4">
					<NavigationList>
						{navigationItemsFooter.map((item) => (
							<NavigationListItem
								key={item.id}
								{...item}
								variant="collapsed"
								currentPath={currentPath}
							/>
						))}
					</NavigationList>
				</div>
			</NavigationRailContentsContainer>
		</NavigationRailContainer>
	);
}
