"use client";

import clsx from "clsx/lite";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink(
	props: React.PropsWithChildren<{
		pathname: string;
	}>,
) {
	const pathname = usePathname();

	return (
		<Link
			className={clsx(
				// Match Studio sidebar link style (color-only, no underline bar)
				"text-sm flex items-center gap-2 h-[34px] rounded-lg px-1 ml-6",
				"transition-colors",
				"data-[state=active]:text-[color:var(--color-blue-light)]",
				"data-[state=inactive]:text-link-muted data-[state=inactive]:hover:text-[color:var(--color-blue-light)]",
			)}
			href={props.pathname}
			data-state={pathname === props.pathname ? "active" : "inactive"}
		>
			{props.children}
		</Link>
	);
}
