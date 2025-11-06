import Link from "next/link";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronRight, ExternalLink } from "lucide-react";
import { PopoverContent } from "@giselle-internal/ui/popover";
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
		case "submenu":
			return props.variant === "expanded" ? (
				<DropdownMenuPrimitive.Root>
					<DropdownMenuPrimitive.Trigger asChild>
						<button
							type="button"
							className="text-stage-sidebar-text text-sm flex items-center py-0.5 hover:text-stage-sidebar-text-hover rounded-lg px-1 w-full cursor-pointer outline-none"
						>
							<div className="size-8 flex items-center justify-center">
								<props.icon className="size-4" />
							</div>
							<span className="flex-1 text-left">{props.label}</span>
							<ChevronRight className="size-3 ml-auto" />
						</button>
					</DropdownMenuPrimitive.Trigger>
					<DropdownMenuPrimitive.Portal>
						<DropdownMenuPrimitive.Content
							className="z-50 w-[180px]"
							sideOffset={4}
							side="right"
							align="start"
						>
							<PopoverContent>
								{props.items.map((item) => (
									<DropdownMenuPrimitive.Item
										key={item.label}
										className="text-text outline-none cursor-pointer hover:bg-ghost-element-hover rounded-[4px] px-[8px] py-[6px] text-[14px] data-disabled:opacity-50 data-disabled:pointer-events-none"
										asChild={!item.disabled}
										disabled={item.disabled}
									>
										{item.disabled ? (
											<span className="w-full flex items-center justify-between">
												{item.label}
											</span>
										) : (
											<a
												href={item.href}
												target="_blank"
												rel="noopener"
												className="w-full flex items-center justify-between"
											>
												{item.label}
												{item.external && <ExternalLink className="w-3 h-3" />}
											</a>
										)}
									</DropdownMenuPrimitive.Item>
								))}
							</PopoverContent>
						</DropdownMenuPrimitive.Content>
					</DropdownMenuPrimitive.Portal>
				</DropdownMenuPrimitive.Root>
			) : (
				<a
					href={props.items[0]?.href || "#"}
					target="_blank"
					rel="noopener"
					className="text-stage-sidebar-text text-sm flex items-center py-0.5 hover:text-stage-sidebar-text-hover rounded-lg px-1"
				>
					<div className="size-8 flex items-center justify-center">
						<props.icon className="size-4" />
					</div>
				</a>
			);
		default: {
			const _exhaustiveCheck: never = props;
			throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
		}
	}
}
