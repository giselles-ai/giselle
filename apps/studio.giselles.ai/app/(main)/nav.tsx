"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC } from "react";

// Define menu items as an array
const menuItems = [
	{ name: "Apps", path: "/apps" },
	{ name: "Members", path: "/settings/team/members" },
	{ name: "Integrations", path: "/settings/team/integrations" },
	{ name: "Vector Stores", path: "/settings/team/vector-stores" },
	{ name: "Usage", path: "/settings/team/usage" },
	{ name: "Team Settings", path: "/settings/team" },
];

export const Nav: FC = () => {
	const pathname = usePathname();

	// hide nav on settings/account page
	if (pathname.startsWith("/settings/account")) {
		return null;
	}

	// find the best match path
	let bestMatchPath = "";
	let bestMatchIndex = -1;

	menuItems.forEach((item, index) => {
		if (
			pathname.startsWith(item.path) &&
			item.path.length > bestMatchPath.length
		) {
			bestMatchPath = item.path;
			bestMatchIndex = index;
		}
	});

	return (
		<div className="flex items-center px-[24px] py-0 border-t border-black-900/50">
			<div className="flex items-center space-x-[12px]">
				{menuItems.map((item, index) => {
					const isActive = index === bestMatchIndex;
					return (
						<Link
							key={item.path}
							href={item.path}
							aria-label={`${item.name} menu`}
							className={`text-[16px] font-sans font-medium transition-colors px-2 py-2 relative rounded-md
							${
								isActive
									? "text-primary-100 [text-shadow:0px_0px_20px_#0087f6] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-primary-100"
									: "text-black-70 hover:text-white-100 hover:after:content-[''] hover:after:absolute hover:after:left-0 hover:after:right-0 hover:after:bottom-0 hover:after:h-[2px] hover:after:bg-primary-100"
							}`}
						>
							{item.name}
						</Link>
					);
				})}
			</div>
		</div>
	);
};
