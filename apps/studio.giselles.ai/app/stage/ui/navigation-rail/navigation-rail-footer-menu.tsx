"use client";

import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "@giselle-internal/ui/dialog";
import { PopoverContent } from "@giselle-internal/ui/popover";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import clsx from "clsx/lite";
import { ChevronRight, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useCallback, useState } from "react";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { SignOutButton } from "@/services/accounts/components/user-button/sign-out-button";
import { buttonVariants } from "../../../(main)/settings/components/button";
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
	"text-text outline-none cursor-pointer hover:bg-ghost-element-hover rounded-[4px] px-[8px] py-[6px] text-[14px]";

export function NavigationRailFooterMenu({
	user: userPromise,
	variant,
}: {
	user: Promise<UserDataForNavigationRail>;
	variant: NavigationRailState;
}) {
	const user = use(userPromise);
	const router = useRouter();
	const searchParams = useSearchParams();
	const isCarouselView = searchParams.get("view") === "carousel";
	const [isDisplayDialogOpen, setIsDisplayDialogOpen] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const setIsCarouselView = useCallback(
		(value: boolean) => {
			const params = new URLSearchParams(searchParams.toString());
			if (value) {
				params.set("view", "carousel");
			} else {
				params.delete("view");
			}
			router.push(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	return (
		<DropdownMenuPrimitive.Root
			open={dropdownOpen && !isDisplayDialogOpen}
			onOpenChange={(open) => {
				if (!isDisplayDialogOpen) {
					setDropdownOpen(open);
				}
			}}
		>
			<DropdownMenuPrimitive.Trigger asChild>
				<button
					className="w-full hover:bg-ghost-element-hover h-full rounded-md cursor-pointer outline-none p-1.5 flex items-center gap-2"
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
							<p className="truncate text-[var(--color-stage-accent)] text-[10px]">
								{user.planName}
							</p>
						</div>
					)}
				</button>
			</DropdownMenuPrimitive.Trigger>
			<DropdownMenuPrimitive.Portal>
				<DropdownMenuPrimitive.Content
					align={variant === "expanded" ? "center" : "start"}
					className={`z-50 ${
						variant === "expanded"
							? "w-[var(--radix-dropdown-menu-trigger-width)]"
							: ""
					}`}
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

						{/* Display type */}
						<DropdownMenuPrimitive.Item
							className={MENU_ITEM_CLASS}
							onClick={() => {
								setDropdownOpen(false);
								setIsDisplayDialogOpen(true);
							}}
						>
							Display type
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
						<DropdownMenuPrimitive.Separator className="h-px bg-white/10 my-1" />

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
						<DropdownMenuPrimitive.Separator className="h-px bg-white/10 my-1" />

						{/* Logout */}
						<DropdownMenuPrimitive.Item className={MENU_ITEM_CLASS}>
							<SignOutButton className="text-[14px]">Log out</SignOutButton>
						</DropdownMenuPrimitive.Item>
					</PopoverContent>
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>

			{/* Display Type Dialog */}
			<Dialog open={isDisplayDialogOpen} onOpenChange={setIsDisplayDialogOpen}>
				<DialogContent>
					<div className="flex items-center justify-between mb-6">
						<DialogTitle className="text-[20px] font-medium text-white-400 tracking-tight font-sans">
							View Style
						</DialogTitle>
						<button
							type="button"
							onClick={() => setIsDisplayDialogOpen(false)}
							className="p-1 rounded-lg hover:bg-white/10 transition-colors"
						>
							<X className="w-5 h-5 text-white-400" />
						</button>
					</div>

					{/* View Type Selection */}
					<div className="mb-6">
						<Label className="text-white-800 font-medium text-[12px] leading-[20.4px] font-geist">
							Display Type
						</Label>
						<RadioGroup
							value={isCarouselView ? "carousel" : "list"}
							onValueChange={(value) => setIsCarouselView(value === "carousel")}
							className="grid grid-cols-2 gap-4 mt-2"
						>
							<Card
								className={clsx(
									"cursor-pointer border-[1px]",
									!isCarouselView ? "border-blue-500" : "border-white/10",
								)}
							>
								<label htmlFor="list">
									<CardHeader>
										<div className="flex flex-col gap-2">
											<CardTitle className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-sans">
												List
											</CardTitle>
											<div className="flex items-center mb-2">
												<RadioGroupItem
													value="list"
													id="list"
													className="text-blue-500 data-[state=checked]:border-[1.5px] data-[state=checked]:border-blue-500"
												/>
											</div>
											<CardDescription className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
												Simple vertical list
											</CardDescription>
										</div>
									</CardHeader>
								</label>
							</Card>
							<Card
								className={clsx(
									"cursor-pointer border-[1px]",
									isCarouselView ? "border-blue-500" : "border-white/10",
								)}
							>
								<label htmlFor="carousel">
									<CardHeader>
										<div className="flex flex-col gap-2">
											<CardTitle className="text-white-400 text-[16px] leading-[27.2px] tracking-normal font-sans">
												Carousel
											</CardTitle>
											<div className="flex items-center mb-2">
												<RadioGroupItem
													value="carousel"
													id="carousel"
													className="text-blue-500 data-[state=checked]:border-[1.5px] data-[state=checked]:border-blue-500"
												/>
											</div>
											<CardDescription className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
												Interactive circular layout
											</CardDescription>
										</div>
									</CardHeader>
								</label>
							</Card>
						</RadioGroup>
					</div>

					{/* Font Options */}
					<div className="mb-6">
						<label
							htmlFor="font-select"
							className="block text-white-400 text-sm font-medium mb-3"
						>
							Font
						</label>
						<select
							id="font-select"
							disabled
							className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white-100 text-sm opacity-50 cursor-not-allowed"
						>
							<option className="bg-gray-900">Coming Soon</option>
						</select>
					</div>

				</DialogContent>
			</Dialog>
		</DropdownMenuPrimitive.Root>
	);
}
