"use client";

import {
	GiselleIcon,
	Tooltip,
	WilliIcon,
} from "@giselle-internal/workflow-designer-ui";
import clsx from "clsx/lite";
import {
	Book,
	ChevronDown,
	ChevronLeft,
	Home,
	Library,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AvatarImage } from "@/services/accounts/components/user-button/avatar-image";

interface StageSidebarProps {
	user?: {
		displayName?: string;
		email?: string;
		avatarUrl?: string;
	};
}

interface MenuItem {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	href: string;
	active?: boolean;
}

interface BottomItem {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	href: string;
}

export function StageSidebar({ user }: StageSidebarProps) {
	const [isCollapsed, setIsCollapsed] = useState(false);

	const menuItems: MenuItem[] = [
		{ icon: Sparkles, label: "Generation", href: "/stage", active: true },
		{ icon: Library, label: "Showcase", href: "/showcase", active: false },
		{ icon: WilliIcon, label: "Acts", href: "/acts", active: false },
	];

	const bottomItems: BottomItem[] = [
		{
			icon: Book,
			label: "Docs",
			href: "https://docs.giselles.ai/guides/introduction",
		},
		{ icon: Home, label: "Lobby", href: "/apps" },
	];

	const renderIcon = (
		IconComponent: React.ComponentType<{ className?: string }>,
		label: string,
	) => {
		const icon = <IconComponent className="w-5 h-5" />;
		return isCollapsed ? (
			<Tooltip text={label} side="right" variant="light">
				{icon}
			</Tooltip>
		) : (
			icon
		);
	};

	const renderBottomItem = (item: BottomItem) => {
		const isExternalLink = item.href.startsWith("http");
		const commonClassName = clsx(
			"flex items-center text-sm text-white-700 hover:text-white-900 hover:bg-white/5 transition-colors",
			isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
		);

		const content = (
			<>
				{renderIcon(item.icon, item.label)}
				{!isCollapsed && <span>{item.label}</span>}
			</>
		);

		if (isExternalLink) {
			return (
				<a
					key={item.label}
					href={item.href}
					target="_blank"
					rel="noopener noreferrer"
					className={commonClassName}
				>
					{content}
				</a>
			);
		}

		return (
			<Link
				key={item.label}
				href={item.href}
				className={commonClassName}
				title={isCollapsed ? item.label : undefined}
			>
				{content}
			</Link>
		);
	};

	return (
		<div
			className={clsx(
				"h-screen bg-black-950 flex flex-col border-r border-white/10 transition-all duration-300",
				isCollapsed ? "w-[48px]" : "w-[200px]",
			)}
		>
			{/* Header Section */}
			<div
				className={clsx(
					"py-2 border-b border-white/10",
					isCollapsed ? "px-2" : "px-4",
				)}
			>
				<div className="mb-4 relative">
					{isCollapsed ? (
						<>
							<div className="flex items-center justify-center">
								<GiselleIcon className="text-white-900 w-[24px] h-[24px] flex-shrink-0" />
							</div>
							<button
								type="button"
								onClick={() => setIsCollapsed(!isCollapsed)}
								className="absolute top-[6px] right-[-10px] text-white-700 hover:text-white-900 transition-colors"
							>
								<ChevronLeft className="w-4 h-4 transition-transform duration-300 rotate-180" />
							</button>
						</>
					) : (
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-[3px]">
								<GiselleIcon className="text-white-900 w-[24px] h-[24px]" />
								<span className="text-white-900 text-[13px] font-semibold">
									Stage
								</span>
							</div>
							<button
								type="button"
								onClick={() => setIsCollapsed(!isCollapsed)}
								className="text-white-700 hover:text-white-900 transition-colors"
							>
								<ChevronLeft className="w-4 h-4 transition-transform duration-300" />
							</button>
						</div>
					)}
				</div>

				{/* User Profile Section */}
				{user && (
					<DropdownMenu>
						<DropdownMenuTrigger
							className="cursor-pointer w-full"
							aria-label="Profile menu"
						>
							<div
								className={clsx(
									"flex items-center",
									isCollapsed ? "justify-center" : "gap-3",
								)}
							>
								{isCollapsed ? (
									<Tooltip
										text={user.displayName || user.email || "User"}
										side="right"
										variant="light"
									>
										<AvatarImage
											className="w-8 h-8 rounded-full"
											avatarUrl={user.avatarUrl ?? null}
											width={32}
											height={32}
											alt={user.displayName || user.email || "User"}
										/>
									</Tooltip>
								) : (
									<AvatarImage
										className="w-8 h-8 rounded-full"
										avatarUrl={user.avatarUrl ?? null}
										width={32}
										height={32}
										alt={user.displayName || user.email || "User"}
									/>
								)}
								{!isCollapsed && (
									<>
										<div className="flex-1 min-w-0 text-left">
											<span className="font-bold text-sm text-white-400 truncate block">
												{user.displayName || "No display name"}
											</span>
										</div>
										<ChevronDown className="w-3 h-3 text-black-600 hover:text-white-700 transition-colors" />
									</>
								)}
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="p-2 border-[0.5px] border-white/10 rounded-xl shadow-[0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)] bg-black-900/50 backdrop-blur-md"
						>
							<DropdownMenuLabel className="flex flex-col px-2 pt-2 pb-1 text-white-400">
								<span className="font-bold text-[16px] leading-[16px] font-geist">
									{user.displayName || "No display name"}
								</span>
								<span className="font-medium leading-[20.4px] font-geist text-black-600">
									{user.email}
								</span>
							</DropdownMenuLabel>
							<DropdownMenuSeparator className="bg-white/10" />
							<div className="py-1 space-y-1">
								<DropdownMenuItem
									className="p-0 rounded-lg focus:bg-white/5"
									asChild
								>
									<Link
										href="/settings/account"
										className="block px-2 py-1.5 w-full text-white-400 font-medium text-[14px] leading-[14px] font-geist"
										aria-label="Account settings"
									>
										Account Settings
									</Link>
								</DropdownMenuItem>
							</div>
							<DropdownMenuSeparator className="bg-white/10" />
							<div className="py-1 space-y-1">
								<DropdownMenuItem className="p-0 rounded-lg focus:bg-white/5">
									<a
										href="https://giselles.ai/"
										target="_blank"
										className="block px-2 py-1.5 w-full text-white-400 font-medium text-[14px] leading-[14px] font-geist"
										rel="noreferrer"
									>
										Home Page
									</a>
								</DropdownMenuItem>
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>

			{/* Navigation Menu */}
			<div className="flex-1 py-4">
				<nav>
					{menuItems.map((item) => (
						<Link
							key={item.label}
							href={item.href}
							className={clsx(
								"flex items-center text-sm transition-colors",
								isCollapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-3",
								item.active
									? "text-[color:var(--color-text-nav-active)]"
									: "text-[color:var(--color-text-nav-inactive)] hover:text-[color:var(--color-text-nav-active)]",
							)}
						>
							{renderIcon(item.icon, item.label)}
							{!isCollapsed && <span>{item.label}</span>}
						</Link>
					))}
				</nav>
			</div>

			{/* Bottom Section */}
			<div className="py-4">{bottomItems.map(renderBottomItem)}</div>
		</div>
	);
}
