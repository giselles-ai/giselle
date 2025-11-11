"use client";

import clsx from "clsx/lite";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export interface TabLink {
	href: string;
	label: string;
}

interface TabNavigationProps {
	links: readonly TabLink[];
	ariaLabelPrefix?: string;
}

export function TabNavigation({
	links,
	ariaLabelPrefix = "menu",
}: TabNavigationProps) {
	const pathname = usePathname();
	const searchParams = useSearchParams();

	return (
		<div className="flex items-center px-0 py-0 border-b border-border mb-3">
			<div className="flex items-center space-x-[12px]">
				{links.map((link) => {
					// Parse the link href to compare pathname and search params
					const linkUrl = new URL(link.href, "http://localhost");
					const currentPathname = pathname;
					const linkPathname = linkUrl.pathname;

					// Compare pathnames
					const pathnameMatches = linkPathname === currentPathname;

					if (!pathnameMatches) {
						return (
							<Link
								key={link.href}
								href={link.href}
								aria-label={`${link.label} ${ariaLabelPrefix}`}
								className={clsx(
									"text-[16px] font-sans font-medium transition-colors px-2 py-2 relative rounded-md",
									"text-tabs-inactive-text hover:text-white-100 hover:after:content-[''] hover:after:absolute hover:after:left-0 hover:after:right-0 hover:after:bottom-0 hover:after:h-[2px] hover:after:bg-primary-100",
								)}
							>
								{link.label}
							</Link>
						);
					}

					// Compare search params
					const linkSearchParams = new URLSearchParams(linkUrl.search);
					const currentSearchParams = new URLSearchParams(
						searchParams.toString(),
					);

					// Special handling for /stage page: if link has filter=all and current has no filter param,
					// treat them as matching (since /stage defaults to filter=all)
					const linkFilter = linkSearchParams.get("filter");
					const currentFilter = currentSearchParams.get("filter");
					const isStagePage = pathname === "/stage";
					const isAllFilterLink = linkFilter === "all";
					const hasNoFilterParam = currentFilter === null;

					if (
						isStagePage &&
						isAllFilterLink &&
						hasNoFilterParam &&
						linkSearchParams.toString() === "filter=all"
					) {
						// Match /stage with /stage?filter=all
						return (
							<Link
								key={link.href}
								href={link.href}
								aria-label={`${link.label} ${ariaLabelPrefix}`}
								className={clsx(
									"text-[16px] font-sans font-medium transition-colors px-2 py-2 relative rounded-md",
									"text-primary-100 [text-shadow:0px_0px_20px_#0087f6] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-primary-100",
								)}
							>
								{link.label}
							</Link>
						);
					}

					// Special handling for /stage/showcase page: if link has tab=Apps and current has no tab param,
					// treat them as matching (since /stage/showcase defaults to tab=Apps)
					const linkTab = linkSearchParams.get("tab");
					const currentTab = currentSearchParams.get("tab");
					const isShowcasePage = pathname === "/stage/showcase";
					const isAppsTabLink = linkTab === "Apps";
					const hasNoTabParam = currentTab === null;

					if (
						isShowcasePage &&
						isAppsTabLink &&
						hasNoTabParam &&
						linkSearchParams.toString() === "tab=Apps"
					) {
						// Match /stage/showcase with /stage/showcase?tab=Apps
						return (
							<Link
								key={link.href}
								href={link.href}
								aria-label={`${link.label} ${ariaLabelPrefix}`}
								className={clsx(
									"text-[16px] font-sans font-medium transition-colors px-2 py-2 relative rounded-md",
									"text-primary-100 [text-shadow:0px_0px_20px_#0087f6] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-primary-100",
								)}
							>
								{link.label}
							</Link>
						);
					}

					// Check if all params in link match current params
					let searchParamsMatch = true;
					for (const [key, value] of linkSearchParams.entries()) {
						if (currentSearchParams.get(key) !== value) {
							searchParamsMatch = false;
							break;
						}
					}

					// If link has no search params, it matches when current has no params
					// If link has search params, check if they match
					const isActive =
						linkSearchParams.toString() === ""
							? currentSearchParams.toString() === ""
							: searchParamsMatch;

					return (
						<Link
							key={link.href}
							href={link.href}
							aria-label={`${link.label} ${ariaLabelPrefix}`}
							className={clsx(
								"text-[16px] font-sans font-medium transition-colors px-2 py-2 relative rounded-md",
								isActive
									? "text-primary-100 [text-shadow:0px_0px_20px_#0087f6] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-primary-100"
									: "text-tabs-inactive-text hover:text-white-100 hover:after:content-[''] hover:after:absolute hover:after:left-0 hover:after:right-0 hover:after:bottom-0 hover:after:h-[2px] hover:after:bg-primary-100",
							)}
						>
							{link.label}
						</Link>
					);
				})}
			</div>
		</div>
	);
}
