"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarMenu() {
	const pathname = usePathname();

	const links = [
		{ href: "/settings/account", label: "Overview" },
		{ href: "/settings/account/general", label: "General" },
		{ href: "/settings/account/authentication", label: "Authentication" },
	];

	return (
		<div className="w-[200px] min-h-full flex flex-col pt-0">
			<div className="flex flex-col space-y-2">
				{links.map((link) => (
					<Link
						key={link.href}
						href={link.href}
						className={cn(
							"text-[16px] font-sans font-medium rounded-lg px-4 py-1 hover:bg-white/5",
							{
								"text-white-400": pathname === link.href,
								"text-black-70": pathname !== link.href,
							},
						)}
					>
						{link.label}
					</Link>
				))}
			</div>
		</div>
	);
}
