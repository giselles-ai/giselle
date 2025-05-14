"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC } from "react";

// Define menu items as an array
const menuItems = [
	{ name: "Apps", path: "/apps" },
	{ name: "Members", path: "/settings/team/members" },
	{ name: "Integrations", path: "/settings/team/integrations" },
	{ name: "Usage", path: "/settings/team/usage" },
	{ name: "Team Settings", path: "/settings/team" },
];

export const Nav: FC = () => {
	const pathname = usePathname();

	// hide nav on settings/account page
	if (pathname.startsWith("/settings/account")) {
		return null;
	}

	// 現在のパスに最もマッチする項目を見つける
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
			<div className="flex items-center">
				{menuItems.map((item, index) => {
					const isActive = index === bestMatchIndex;

					return (
						<Link
							key={item.path}
							href={item.path}
							className={`text-[16px] font-hubot font-medium transition-colors px-2 py-2 relative rounded-md
							${
								isActive
									? "text-primary-100 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-primary-100"
									: "text-black-70 hover:text-white-100 hover:bg-white-950/20"
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
