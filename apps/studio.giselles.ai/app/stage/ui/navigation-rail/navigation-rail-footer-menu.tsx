"use client";

import { PopoverContent } from "@giselle-internal/ui/popover";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { SignOutButton } from "@/services/accounts/components/user-button/sign-out-button";
import type { NavigationRailState, UserDataForNavigationRail } from "./types";

const HELP_ITEMS = [
	{
		label: "Docs",
		href: "https://docs.giselles.ai/guides/introduction",
		external: true,
	},
	{
		label: "Terms",
		href: "https://giselles.ai/legal/terms",
		external: true,
	},
	{
		label: "Privacy & Cookies",
		href: "https://giselles.ai/legal/privacy",
		external: true,
	},
	{
		label: "Contact Us",
		href: "mailto:support@giselles.ai",
		external: true,
	},
] as const;

const MENU_ITEM_CLASS =
	"text-text outline-none cursor-pointer hover:bg-[var(--color-stage-sidebar-icon-hover)] rounded-[4px] px-[8px] py-[6px] text-[14px]";

export function NavigationRailFooterMenu({
	user: userPromise,
	variant,
}: {
	user: Promise<UserDataForNavigationRail>;
	variant: NavigationRailState;
}) {
	const user = use(userPromise);

	return (
		<DropdownMenuPrimitive.Root>
			<DropdownMenuPrimitive.Trigger asChild>
				<button
					className={`group w-full h-full rounded-md cursor-pointer outline-none ${variant === "collapsed" ? "py-0 px-0 data-[state=open]:py-1.5 data-[state=open]:px-1.5" : "py-1.5 px-1.5"} flex items-center ${variant === "collapsed" ? "gap-0 justify-center" : "gap-2"}`}
					type="button"
				>
					<div className="size-8 flex items-center justify-center shrink-0">
						<AvatarImage
							className="rounded-full"
							avatarUrl={user.avatarUrl ?? null}
							width={24}
							height={24}
							alt={user.displayName || user.email || "User"}
						/>
					</div>
					{variant === "expanded" && (
						<div className="flex flex-col min-w-0 flex-1 text-left">
							<p className="truncate text-text-muted text-sm">
								{user.displayName ?? user.email}
							</p>
							<p className="truncate text-stage-accent text-[10px]">
								{user.planName}
							</p>
						</div>
					)}
					{variant !== "collapsed" && (
						<ChevronDown className="w-3 h-3 ml-auto text-stage-sidebar-text-hover transition-transform duration-200 group-data-[state=open]:rotate-180" />
					)}
				</button>
			</DropdownMenuPrimitive.Trigger>
			<DropdownMenuPrimitive.Portal>
				<DropdownMenuPrimitive.Content
					align={variant === "expanded" ? "center" : "start"}
					sideOffset={8}
					className={`z-50`}
					style={{
						width:
							variant === "expanded"
								? "calc(var(--radix-dropdown-menu-trigger-width) + 12px)"
								: undefined,
					}}
				>
					<PopoverContent>
						{/* Account Settings */}
						<DropdownMenuPrimitive.Item
							className={`${MENU_ITEM_CLASS} flex items-center justify-between`}
							asChild
						>
							<Link href="/settings/account" className="w-full">
								Account settings
							</Link>
						</DropdownMenuPrimitive.Item>

						{/* Help with Submenu */}
						<DropdownMenuPrimitive.Sub>
							<DropdownMenuPrimitive.SubTrigger
								className={`${MENU_ITEM_CLASS} flex items-center justify-between w-full`}
							>
								Help
								<ChevronRight className="w-3 h-3" />
							</DropdownMenuPrimitive.SubTrigger>
							<DropdownMenuPrimitive.Portal>
								<DropdownMenuPrimitive.SubContent
									className="z-50 w-[180px]"
									sideOffset={4}
								>
									<PopoverContent>
										{HELP_ITEMS.map((item) => (
											<DropdownMenuPrimitive.Item
												key={item.label}
												className={MENU_ITEM_CLASS}
												asChild
											>
												{item.external ? (
													<a
														href={item.href}
														target="_blank"
														rel="noopener"
														className="w-full flex items-center justify-between"
													>
														{item.label}
														<ExternalLink className="w-3 h-3" />
													</a>
												) : (
													<Link href={item.href} className="w-full block">
														{item.label}
													</Link>
												)}
											</DropdownMenuPrimitive.Item>
										))}
									</PopoverContent>
								</DropdownMenuPrimitive.SubContent>
							</DropdownMenuPrimitive.Portal>
						</DropdownMenuPrimitive.Sub>

						{/* Separator */}
						<DropdownMenuPrimitive.Separator className="h-px bg-border my-1" />

						{/* Lobby */}
						<DropdownMenuPrimitive.Item className={MENU_ITEM_CLASS} asChild>
							<Link href="/apps" className="w-full block">
								Lobby
							</Link>
						</DropdownMenuPrimitive.Item>

						{/* Homepage */}
						<DropdownMenuPrimitive.Item className={MENU_ITEM_CLASS} asChild>
							<a
								href="https://giselles.ai"
								target="_blank"
								rel="noopener"
								className="w-full flex items-center justify-between"
							>
								Homepage
								<ExternalLink className="w-3 h-3" />
							</a>
						</DropdownMenuPrimitive.Item>

						{/* Separator */}
						<DropdownMenuPrimitive.Separator className="h-px bg-border my-1" />

						{/* Logout */}
						<DropdownMenuPrimitive.Item className={MENU_ITEM_CLASS}>
							<SignOutButton className="text-[14px]">Log out</SignOutButton>
						</DropdownMenuPrimitive.Item>
					</PopoverContent>
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
}
