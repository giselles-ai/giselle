import { PopoverContent } from "@giselle-internal/ui/popover";
import { clsx } from "clsx/lite";
import { ChevronRightIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { use } from "react";
import type { TeamPlan } from "@/db";
import { getCurrentUser } from "@/lib/get-current-user";
import { logger } from "@/lib/logger";
import { getUser } from "@/lib/supabase";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";
import { SignOutButton } from "@/services/accounts/components/user-button/sign-out-button";
import { fetchCurrentTeam } from "@/services/teams";

const links = [
	{
		title: "Docs",
		href: "https://docs.giselles.ai/en/guides/introduction",
	},
	{
		title: "Terms",
		href: "https://giselles.ai/legal/terms",
	},
	{
		title: "Privacy & Cookies",
		href: "https://giselles.ai/legal/privacy",
	},
	{
		title: "Contact Us",
		href: "mailto:support@giselles.ai",
	},
] as const;

const planTitle: Record<TeamPlan, string> = {
	free: "Free plan",
	pro: "Pro plan",
	team: "Team plan",
	enterprise: "Enterprise plan",
	internal: "Internal plan",
};

function DropdownMenuItem({
	className,
	...props
}: DropdownMenu.DropdownMenuItemProps) {
	return (
		<DropdownMenu.Item
			className={clsx(
				"text-text outline-none cursor-pointer hover:bg-ghost-element-hover rounded-[4px] px-[8px] py-[6px] text-[14px]",
				className,
			)}
			{...props}
		/>
	);
}

function DropdownMenuSubTrigger({
	className,
	...props
}: DropdownMenu.DropdownMenuSubTriggerProps) {
	return (
		<DropdownMenu.SubTrigger
			className={clsx(
				"text-text outline-none cursor-pointer hover:bg-ghost-element-hover rounded-[4px] px-[8px] py-[6px] text-[14px] flex items-center justify-between w-full",
				className,
			)}
			{...props}
		/>
	);
}

export async function loadCurrentUser() {
	const [supabaseUser, currentUser, currentTeam] = await Promise.all([
		getUser(),
		getCurrentUser(),
		fetchCurrentTeam(),
	]);

	if (currentUser.email === null) {
		logger.warn(`email not set for:  ${supabaseUser.id}`);
	}

	return {
		displayName: currentUser.displayName ?? undefined,
		email: currentUser.email,
		avatarUrl: currentUser.avatarUrl,
		team: {
			id: currentTeam.id,
			name: currentTeam.name,
			avatarUrl: currentTeam.avatarUrl ?? undefined,
			plan: currentTeam.plan,
		},
	};
}
type CurrentUser = Awaited<ReturnType<typeof loadCurrentUser>>;

export function AccountMenu({
	currentUserPromise,
}: {
	currentUserPromise: Promise<CurrentUser>;
}) {
	const currentUser = use(currentUserPromise);
	return (
		<div className="flex items-center">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger asChild>
					<button
						className="w-full hover:bg-ghost-element-hover h-full rounded-[8px] cursor-pointer outline-none px-1 py-1.5 flex items-center justify-center"
						type="button"
					>
						<div className="size-8 flex items-center justify-center shrink-0">
							<AvatarImage
								className="rounded-full w-8 h-8"
								avatarUrl={currentUser.avatarUrl}
								width={32}
								height={32}
								alt={
									currentUser.displayName || currentUser.email || "user avatar"
								}
							/>
						</div>
					</button>
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						align="start"
						alignOffset={0}
						sideOffset={4}
						className="z-50 min-w-[200px]"
					>
						<PopoverContent>
							{/* User Info */}
							<div className="px-[8px] py-[6px] mb-1">
								<div className="flex items-center gap-2 mb-2">
									<AvatarImage
										className="rounded-full shrink-0"
										avatarUrl={currentUser.avatarUrl}
										width={32}
										height={32}
										alt={
											currentUser.displayName ||
											currentUser.email ||
											"user avatar"
										}
									/>
									<div className="flex flex-col min-w-0 flex-1 text-left">
										<p className="truncate text-text text-sm font-medium">
											{currentUser.displayName ?? currentUser.email}
										</p>
										<p className="truncate text-text-muted text-[10px]">
											{planTitle[currentUser.team.plan]}
										</p>
									</div>
								</div>
							</div>
							<DropdownMenu.Separator className="h-px bg-white/10 my-1" />
							{/* Account Settings with Submenu */}
							<DropdownMenu.Sub>
								<DropdownMenuSubTrigger>
									Account settings
									<ChevronRightIcon className="w-3 h-3" />
								</DropdownMenuSubTrigger>
								<DropdownMenu.Portal>
									<DropdownMenu.SubContent
										className="z-50 w-[180px]"
										sideOffset={4}
									>
										<PopoverContent>
											<DropdownMenuItem asChild>
												<Link href="/settings/account" className="w-full block">
													Overview
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link
													href="/settings/account/general"
													className="w-full block"
												>
													General
												</Link>
											</DropdownMenuItem>
											<DropdownMenuItem asChild>
												<Link
													href="/settings/account/authentication"
													className="w-full block"
												>
													Authentication
												</Link>
											</DropdownMenuItem>
										</PopoverContent>
									</DropdownMenu.SubContent>
								</DropdownMenu.Portal>
							</DropdownMenu.Sub>

							{/* Help with Submenu */}
							<DropdownMenu.Sub>
								<DropdownMenuSubTrigger>
									Help
									<ChevronRightIcon className="w-3 h-3" />
								</DropdownMenuSubTrigger>
								<DropdownMenu.Portal>
									<DropdownMenu.SubContent
										className="z-50 w-[180px]"
										sideOffset={4}
									>
										<PopoverContent>
											{links.map((item) => (
												<DropdownMenuItem key={item.href} asChild>
													<a
														href={item.href}
														target="_blank"
														rel="noopener"
														className="w-full flex items-center justify-between"
													>
														{item.title}
														<ExternalLinkIcon className="w-3 h-3" />
													</a>
												</DropdownMenuItem>
											))}
										</PopoverContent>
									</DropdownMenu.SubContent>
								</DropdownMenu.Portal>
							</DropdownMenu.Sub>

							{/* Homepage */}
							<DropdownMenuItem asChild>
								<a
									href="https://giselles.ai"
									target="_blank"
									rel="noopener"
									className="w-full flex items-center justify-between"
								>
									Homepage
									<ExternalLinkIcon className="w-3 h-3" />
								</a>
							</DropdownMenuItem>

							{/* Separator */}
							<DropdownMenu.Separator className="h-px bg-white/10 my-1" />

							{/* Logout */}
							<DropdownMenuItem asChild>
								<SignOutButton className="w-full text-left">
									Log Out
								</SignOutButton>
							</DropdownMenuItem>
						</PopoverContent>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>
	);
}
