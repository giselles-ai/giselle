"use client";

import { PopoverContent } from "@giselle-internal/ui/popover";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { ChevronRight, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { SignOutButton } from "@/services/accounts/components/user-button/sign-out-button";
import { TeamCreationForm } from "@/services/teams/components/team-creation-form";
import { formatPlanName } from "@/services/teams/utils";
import type { NavigationRailState, UserDataForNavigationRail } from "./types";

const MENU_ITEM_CLASS =
	"text-text outline-none cursor-pointer hover:bg-ghost-element-hover rounded-[4px] px-[8px] py-[6px] text-[14px]";

const HELP_ITEMS = [
	{
		label: "Docs",
		href: "https://docs.giselles.ai/en/guides/introduction",
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

export function NavigationRailFooterMenu({
	user: userPromise,
	variant,
}: {
	user: Promise<UserDataForNavigationRail>;
	variant: NavigationRailState;
}) {
	const user = use(userPromise);
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted) return null; // defer Radix menu until client mount to avoid id mismatch

	// Plan-aware Create team: allow free only when user doesn't already have a free team
	// and is not an internal user (simple domain check).
	const email = user.email;
	const isInternal = !!email && /@route06\.co\.jp$/.test(email);
	const allTeams = user.allTeams ?? [];
	const hasFreeTeam = allTeams.some((t) => t.isPro === false);
	const canCreateFreeTeam = !isInternal && !hasFreeTeam;

	return (
		<DropdownMenuPrimitive.Root>
			<DropdownMenuPrimitive.Trigger asChild>
				<button
					className={`w-full hover:bg-ghost-element-hover h-full rounded-[8px] cursor-pointer outline-none px-1 py-1.5 flex ${
						variant === "collapsed" ? "justify-center" : "items-center gap-2"
					}`}
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
								{formatPlanName(user.currentTeam.plan)}
							</p>
						</div>
					)}
				</button>
			</DropdownMenuPrimitive.Trigger>
			<DropdownMenuPrimitive.Portal>
				<DropdownMenuPrimitive.Content
					align="start"
					alignOffset={0}
					sideOffset={4}
					className={"z-50 w-[var(--radix-dropdown-menu-trigger-width)]"}
				>
					<PopoverContent>
						{/* Account Settings with Submenu */}
						<DropdownMenuPrimitive.Sub>
							<DropdownMenuPrimitive.SubTrigger
								className={`${MENU_ITEM_CLASS} flex items-center justify-between w-full`}
							>
								Account settings
								<ChevronRight className="w-3 h-3" />
							</DropdownMenuPrimitive.SubTrigger>
							<DropdownMenuPrimitive.Portal>
								<DropdownMenuPrimitive.SubContent
									className="z-50 w-[180px]"
									sideOffset={4}
								>
									<PopoverContent>
										<DropdownMenuPrimitive.Item
											className={MENU_ITEM_CLASS}
											asChild
										>
											<Link href="/settings/account" className="w-full block">
												Overview
											</Link>
										</DropdownMenuPrimitive.Item>
										<DropdownMenuPrimitive.Item
											className={MENU_ITEM_CLASS}
											asChild
										>
											<Link
												href="/settings/account/general"
												className="w-full block"
											>
												General
											</Link>
										</DropdownMenuPrimitive.Item>
										<DropdownMenuPrimitive.Item
											className={MENU_ITEM_CLASS}
											asChild
										>
											<Link
												href="/settings/account/authentication"
												className="w-full block"
											>
												Authentication
											</Link>
										</DropdownMenuPrimitive.Item>
									</PopoverContent>
								</DropdownMenuPrimitive.SubContent>
							</DropdownMenuPrimitive.Portal>
						</DropdownMenuPrimitive.Sub>

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

						{/* Create team dialog (client) */}
						<DropdownMenuPrimitive.Item
							onSelect={(e) => e.preventDefault()}
							className="p-0 rounded-lg"
						>
							<TeamCreationForm
								canCreateFreeTeam={canCreateFreeTeam}
								proPlanPrice="$20"
							>
								<span className="cursor-pointer flex items-center gap-x-2 px-2 py-1.5 rounded-lg w-full hover:bg-white/5">
									<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
										<Plus className="size-3 text-background" />
									</span>
									<span className="text-inverse font-medium text-[14px] leading-[14px] font-geist">
										Create team
									</span>
								</span>
							</TeamCreationForm>
						</DropdownMenuPrimitive.Item>

						{/* Separator */}
						<DropdownMenuPrimitive.Separator className="h-px bg-white/10 my-1" />

						{/* Logout */}
						<DropdownMenuPrimitive.Item className={MENU_ITEM_CLASS} asChild>
							<SignOutButton className="text-[14px] w-full text-left">Log Out</SignOutButton>
						</DropdownMenuPrimitive.Item>
					</PopoverContent>
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
}
