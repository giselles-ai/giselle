"use client";

import clsx from "clsx/lite";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

	return (
		<div className="flex items-center px-0 py-0 border-b border-border mb-3">
			<div className="flex items-center space-x-[12px]">
				{links.map((link) => {
					const isActive = pathname === link.href;
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
