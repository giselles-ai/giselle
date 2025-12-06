"use client";

import clsx from "clsx/lite";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export type ActiveMatchPattern = string | string[];

function isPathActive(pathname: string, pattern?: ActiveMatchPattern) {
	if (!pattern) return false;

	const patterns = Array.isArray(pattern) ? pattern : [pattern];

	let matched = false;

	for (const p of patterns) {
		const isNegation = p.startsWith("!");
		const raw = isNegation ? p.slice(1) : p;

		const isPrefix = raw.endsWith("*");
		const target = isPrefix ? raw.slice(0, -1) : raw;

		const hit = isPrefix ? pathname.startsWith(target) : pathname === target;

		if (!isNegation && hit) {
			matched = true;
		}

		if (isNegation && hit) {
			return false;
		}
	}

	return matched;
}

export interface SidebarLink {
	id: string;
	label: string;
	href: string;
	activeMatchPattern?: ActiveMatchPattern;
}

type SidebarLinkProps = React.ComponentProps<typeof Link> &
	Pick<SidebarLink, "activeMatchPattern">;

export function SidebarLink({
	href,
	children,
	activeMatchPattern,
	...props
}: SidebarLinkProps) {
	const pathname = usePathname();
	const isActive = useMemo(
		() => isPathActive(pathname, activeMatchPattern),
		[pathname, activeMatchPattern],
	);
	return (
		<Link
			href={href}
			className={clsx(
				"text-sm flex items-center gap-2 h-[34px] rounded-lg px-1 ml-6",
				isActive ? "text-accent" : "text-link-muted hover:text-accent",
			)}
			{...props}
		>
			{children}
		</Link>
	);
}
