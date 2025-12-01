import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon, ChevronsLeftIcon } from "lucide-react";
import { useMemo } from "react";
import { CreateAppButton } from "./create-app-button";
import { MenuButton } from "./menu-button";
import type { NavigationItem } from "./navigation-items";
import { navigationItems, navigationItemsFooter } from "./navigation-items";
import { NavigationList } from "./navigation-list";
import { NavigationListItem } from "./navigation-list-item";
import { NavigationRailContainer } from "./navigation-rail-container";
import { NavigationRailContentsContainer } from "./navigation-rail-contents-container";
import { NavigationRailHeader } from "./navigation-rail-header";
import { SessionHistoryAccordion } from "./session-history-accordion";
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
	// Group navigation items by sections
	const groupedItems = useMemo(() => {
		const groups: Array<
			| {
					section: NavigationItem & { type: "section" };
					items: NavigationItem[];
			  }
			| {
					section: null;
					items: NavigationItem[];
			  }
		> = [];
		let currentSection: (NavigationItem & { type: "section" }) | null = null;
		let currentItems: NavigationItem[] = [];

		for (const item of navigationItems) {
			if (item.type === "section") {
				if (currentSection) {
					groups.push({ section: currentSection, items: currentItems });
				}
				currentSection = item;
				currentItems = [];
			} else if (item.type === "divider") {
				if (currentSection) {
					groups.push({ section: currentSection, items: currentItems });
					currentSection = null;
					currentItems = [];
				}
				groups.push({ section: null, items: [item] });
			} else if (currentSection) {
				currentItems.push(item);
			} else {
				groups.push({ section: null, items: [item] });
			}
		}

		if (currentSection) {
			groups.push({ section: currentSection, items: currentItems });
		}

		return groups;
	}, []);

	return (
		<NavigationRailContainer variant="expanded">
			<NavigationRailHeader>
				<div className="flex items-center justify-end w-full">
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
					{/* Create App button before first section */}
					{groupedItems.length > 0 &&
					groupedItems[0]?.section?.id === "section-agent" ? (
						<div className="px-1 pt-3 pb-1">
							<CreateAppButton variant="expanded" />
						</div>
					) : null}
					{groupedItems.map((group) => {
						if (!group.section) {
							// Render non-section items directly
							return group.items.map((item) => {
								if (item.id === "nav-task") {
									return (
										<SessionHistoryAccordion key={item.id} variant="expanded" />
									);
								}
								return (
									<NavigationListItem
										key={item.id}
										{...item}
										variant="expanded"
										currentPath={currentPath}
									/>
								);
							});
						}

						const section = group.section;
						if (section.collapsible) {
							return (
								<Accordion.Root
									key={section.id}
									type="single"
									collapsible
									defaultValue={section.id}
									className="w-full"
								>
									<Accordion.Item value={section.id} className="w-full">
										<Accordion.Trigger className="group w-full text-text-muted text-[13px] font-semibold px-2 pt-3 pb-1 flex items-center gap-2 hover:text-text transition-colors outline-none">
											{section.icon ? (
												<section.icon className="size-4" />
											) : null}
											<span className="flex-1 text-left">{section.label}</span>
											<ChevronDownIcon className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
										</Accordion.Trigger>
										<Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
											{group.items.map((item) => {
												if (item.id === "nav-task") {
													return (
														<SessionHistoryAccordion
															key={item.id}
															variant="expanded"
														/>
													);
												}
												return (
													<NavigationListItem
														key={item.id}
														{...item}
														variant="expanded"
														currentPath={currentPath}
													/>
												);
											})}
										</Accordion.Content>
									</Accordion.Item>
								</Accordion.Root>
							);
						}

						// Non-collapsible section
						return (
							<div key={section.id}>
								<NavigationListItem
									{...section}
									variant="expanded"
									currentPath={currentPath}
								/>
								{group.items.map((item) => (
									<NavigationListItem
										key={item.id}
										{...item}
										variant="expanded"
										currentPath={currentPath}
									/>
								))}
							</div>
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
								variant="expanded"
								currentPath={currentPath}
							/>
						))}
					</NavigationList>
				</div>
			</NavigationRailContentsContainer>
		</NavigationRailContainer>
	);
}
