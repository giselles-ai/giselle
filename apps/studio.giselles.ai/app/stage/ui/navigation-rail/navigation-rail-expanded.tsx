import { ChevronsLeftIcon } from "lucide-react";
import type { ReactNode } from "react";
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
import type { UserDataForNavigationRail } from "./types";

export function NavigationRailExpanded({
	onCollapseButtonClick,
	user: userPromise,
	currentPath,
}: {
	onCollapseButtonClick: () => void;
	user: Promise<UserDataForNavigationRail>;
	currentPath?: string;
}) {
	const user = use(userPromise);

	return (
		<NavigationRailContainer variant="expanded">
			<NavigationRailHeader>
				<div className="flex items-center justify-end w-full pt-6 pb-4">
					<MenuButton
						onClick={() => onCollapseButtonClick()}
						className="cursor-w-resize"
					>
						<ChevronsLeftIcon className="size-5 text-link-muted stroke-1" />
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
								variant="expanded"
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
					<NavigationRailFooterMenu user={userPromise} variant="expanded" />
				</Suspense>
			</NavigationRailFooter>
		</NavigationRailContainer>
	);
}
