import Link from "next/link";
import { Button } from "@/app/(main)/settings/components/button";
import { upgradeCurrentTeam } from "@/services/teams/actions/upgrade-current-team";
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
		case "action":
			return props.variant === "expanded" ? (
				<form className="w-full my-2">
					<Button
						className="block p-2 w-full text-center font-medium text-[14px] leading-[20.4px] font-geist text-white bg-primary-900 hover:bg-primary-900/80 rounded-lg transition-colors"
						formAction={upgradeCurrentTeam}
					>
						Upgrade to Pro
					</Button>
				</form>
			) : (
				<Link
					href="/settings/team"
					className="text-stage-sidebar-text text-sm flex items-center py-0.5 hover:text-stage-sidebar-text-hover rounded-lg px-1"
				>
					<div className="size-8 flex items-center justify-center">
						<props.icon className="size-4" />
					</div>
				</Link>
			);
		case "section":
			return props.variant === "expanded" ? (
				<div className="text-text-muted text-[13px] font-semibold px-2 pt-3 pb-1">
					{props.label}
				</div>
			) : (
				// Reserve the same vertical space (≈35.7px) when label is hidden
				<div className="h-[35.7px]" />
			);
		case "divider":
			return <div className="h-px bg-border/20 my-1 mx-2" />;
		default: {
			const _exhaustiveCheck: never = props.type;
			throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
		}
	}
}
