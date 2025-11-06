import Link from "next/link";
import type { NavigationItem } from "./navigation-items";
import type { NavigationRailState } from "./types";

export function NavigationListItem(
	props: NavigationItem & { variant: NavigationRailState },
) {
	switch (props.type) {
		case "link":
			return (
				<Link
					href={props.href}
					className="text-stage-sidebar-text text-sm flex items-center py-0.5 hover:text-stage-sidebar-text-hover rounded-lg px-1"
				>
					<div className="size-8 flex items-center justify-center">
						<props.icon className="size-4" />
					</div>
					{props.variant === "expanded" && props.label}
				</Link>
			);
		case "external":
			return (
				<a
					href={props.href}
					target="_blank"
					rel="noopener"
					className="text-stage-sidebar-text text-sm flex items-center py-0.5 hover:text-stage-sidebar-text-hover rounded-lg px-1"
				>
					<div className="size-8 flex items-center justify-center">
						{"icon" in props && props.icon ? (
							<props.icon className="size-4" />
						) : (
							<span className="size-4" />
						)}
					</div>
					{props.variant === "expanded" && props.label}
				</a>
			);
		case "section":
			return props.variant === "expanded" ? (
				<div className="text-text-muted text-[13px] font-semibold px-2 pt-3 pb-1">
					{props.label}
				</div>
			) : (
				<div className="h-2" />
			);
		case "divider":
			return <div className="h-px bg-border/20 my-2 mx-2" />;
		default: {
			const _exhaustiveCheck: never = props.type;
			throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
		}
	}
}
