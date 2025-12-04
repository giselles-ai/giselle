import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import { useMemo } from "react";
import { CreateAppButton } from "./create-app-button";
import type { NavigationItem } from "./navigation-items";
import { navigationItems, navigationItemsFooter } from "./navigation-items";
import { NavigationList } from "./navigation-list";
import { NavigationListItem } from "./navigation-list-item";
import { NavigationRailContainer } from "./navigation-rail-container";
import { NavigationRailContentsContainer } from "./navigation-rail-contents-container";
import { NavigationRailHeader } from "./navigation-rail-header";
import type { UserDataForNavigationRail } from "./types";

const stageOnlyItemIds = new Set([
	"section-agent",
	"nav-stage",
	"nav-showcase",
	"nav-task",
	"nav-action-history",
]);

export function NavigationRailExpanded({
	user: _userPromise,
	currentPath,
	enableStage,
}: {
	user: Promise<UserDataForNavigationRail>;
	currentPath?: string;
	enableStage: boolean;
}) {
	// Group navigation items by sections
	const groupedItems = useMemo(() => {
		const filteredItems = enableStage
			? navigationItems
			: navigationItems.filter((item) => !stageOnlyItemIds.has(item.id));

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

		for (const item of filteredItems) {
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
	}, [enableStage]);

	// Get all collapsible section IDs for default value
	const collapsibleSectionIds = useMemo(() => {
		return groupedItems
			.filter(
				(group): group is { section: NavigationItem & { type: "section" }; items: NavigationItem[] } =>
					group.section !== null && group.section.collapsible === true,
			)
			.map((group) => group.section.id);
	}, [groupedItems]);

	return (
		<NavigationRailContainer variant="expanded">
			<NavigationRailHeader>
				{/* Header content removed - no collapse button */}
			</NavigationRailHeader>
			<NavigationRailContentsContainer>
				<NavigationList>
					{/* Create App button before first section */}
					<div className="px-1 pt-3 pb-1">
						<CreateAppButton variant="expanded" />
					</div>
					<Accordion.Root
						type="multiple"
						defaultValue={collapsibleSectionIds}
						className="w-full"
					>
						{groupedItems.map((group) => {
							if (!group.section) {
								// Render non-section items directly
								return group.items.map((item) => (
									<NavigationListItem
										key={item.id}
										{...item}
										variant="expanded"
										currentPath={currentPath}
									/>
								));
							}

							const section = group.section;
							if (section.collapsible) {
								return (
									<Accordion.Item key={section.id} value={section.id} className="w-full">
										<Accordion.Trigger className="group w-full text-text-muted text-[13px] font-semibold px-2 pt-3 pb-1 flex items-center gap-2 hover:text-text transition-colors outline-none">
											{section.icon ? (
												<section.icon className="size-4" />
											) : null}
											<span className="flex-1 text-left">{section.label}</span>
											<ChevronDownIcon className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
										</Accordion.Trigger>
										<Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
											{group.items.map((item) => (
												<NavigationListItem
													key={item.id}
													{...item}
													variant="expanded"
													currentPath={currentPath}
													hideIcon={true}
												/>
											))}
										</Accordion.Content>
									</Accordion.Item>
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
					</Accordion.Root>
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
