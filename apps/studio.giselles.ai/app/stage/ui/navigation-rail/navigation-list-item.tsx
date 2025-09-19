import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavigationItem } from "./navigation-items";
import type { NavigationRailState } from "./types";

export function NavigationListItem(
	props: NavigationItem & { variant: NavigationRailState },
) {
	const pathname = usePathname();
	const active =
		props.type === "link" &&
		(props.isActive ? props.isActive(pathname) : pathname === props.href);
	switch (props.type) {
		case "link":
			return (
				<Link
					href={props.href}
					className={`${active ? "text-stage-sidebar-text-hover font-semibold" : "text-stage-sidebar-text"} text-sm flex items-center py-0.5 hover:text-stage-sidebar-text-hover rounded-lg px-1`}
				>
					<div className="size-8 flex items-center justify-center">
						<props.icon className="size-4" />
					</div>
					{props.variant === "expanded" && props.label}
				</Link>
			);
		default: {
			const _exhaustiveCheck: never = props.type;
			throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
		}
	}
}
