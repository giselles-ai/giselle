import { PopoverContent } from "@giselle-internal/ui/popover";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { NavigationItem } from "./navigation-items";
import type { NavigationRailState } from "./types";

export function NavigationListItem(
	props: NavigationItem & {
		variant: NavigationRailState;
		currentPath?: string;
		hideIcon?: boolean;
	},
) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	switch (props.type) {
		case "link": {
			const isActive =
				"isActive" in props && props.isActive
					? props.isActive(props.currentPath ?? "")
					: props.href === props.currentPath;
			const linkClass = isActive
				? "text-accent"
				: "text-link-muted hover:text-accent";
			return (
				<Link
					href={props.href}
					className={`${linkClass} text-sm flex items-center gap-2 h-[34px] rounded-lg px-1`}
				>
					{!props.hideIcon ? (
						<props.icon className="size-4 shrink-0" />
					) : (
						<span className="w-4 shrink-0" />
					)}
					{props.variant === "expanded" && props.label}
				</Link>
			);
		}
		case "external":
			return (
				<a
					href={props.href}
					target="_blank"
					rel="noopener"
					className="text-link-muted text-sm flex items-center gap-2 py-0.5 hover:text-accent rounded-lg px-1"
				>
					{!props.hideIcon && "icon" in props && props.icon ? (
						<props.icon className="size-4 shrink-0" />
					) : (
						<span className="w-4 shrink-0" />
					)}
					{props.variant === "expanded" && props.label}
				</a>
			);
		case "section":
			return props.variant === "expanded" ? (
				<div className="text-text-muted text-[13px] font-semibold px-2 pt-3 pb-1 flex items-center gap-2">
					{"icon" in props && props.icon ? (
						<props.icon className="size-4 shrink-0" />
					) : (
						<span className="w-4 shrink-0" />
					)}
					{props.label}
				</div>
			) : (
				// Reserve the same vertical space (≈35.5px) when label is hidden
				<div className="h-[35.5px]" />
			);
		case "divider":
			return (
				<div
					className={`h-px my-2 mx-2 ${
						props.id === "divider-2" ? "bg-border/80" : "bg-border/20"
					}`}
				/>
			);
		case "action":
			// Action items are not currently used in navigationItems
			return null;
		case "submenu": {
			const buttonContent = (
				<>
					<props.icon className="size-4 shrink-0" />
					<span className="flex-1 text-left">{props.label}</span>
					<ChevronRight className="size-3 ml-auto" />
				</>
			);
			const buttonClassName =
				"text-link-muted text-sm flex items-center gap-2 py-0.5 hover:text-accent rounded-lg px-1 w-full cursor-pointer outline-none";

			return props.variant === "expanded" ? (
				!mounted ? (
					<button type="button" className={buttonClassName}>
						{buttonContent}
					</button>
				) : (
					<DropdownMenuPrimitive.Root>
						<DropdownMenuPrimitive.Trigger asChild>
							<button type="button" className={buttonClassName}>
								{buttonContent}
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
													{item.external && (
														<ExternalLink className="w-3 h-3" />
													)}
												</a>
											)}
										</DropdownMenuPrimitive.Item>
									))}
								</PopoverContent>
							</DropdownMenuPrimitive.Content>
						</DropdownMenuPrimitive.Portal>
					</DropdownMenuPrimitive.Root>
				)
			) : (
				<a
					href={props.items[0]?.href || "#"}
					target="_blank"
					rel="noopener"
					className="text-link-muted text-sm flex items-center gap-2 py-0.5 hover:text-accent rounded-lg px-1"
				>
					<props.icon className="size-4 shrink-0" />
				</a>
			);
		}
		default: {
			const _exhaustiveCheck: never = props;
			throw new Error(`Unhandled type: ${_exhaustiveCheck}`);
		}
	}
}
