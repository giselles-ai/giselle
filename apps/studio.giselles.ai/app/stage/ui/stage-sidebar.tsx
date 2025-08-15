"use client";

import { Button } from "@giselle-internal/ui/button";
import {
	GiselleIcon,
	Tooltip,
	WilliIcon,
} from "@giselle-internal/workflow-designer-ui";
import clsx from "clsx/lite";
import {
	Bell,
	Book,
	ChevronDown,
	ChevronLeft,
	Home,
	Library,
	Settings,
	Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
	const [isClientMounted, setIsClientMounted] = useState(false);

	useEffect(() => {
		setIsClientMounted(true);
	}, []);

	const menuItems: MenuItem[] = [
		{ icon: Sparkles, label: "New task", href: "/stage", active: true },
		{ icon: Library, label: "Showcase", href: "/showcase", active: false },
		{ icon: WilliIcon, label: "Tasks", href: "/acts", active: false },
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
		<>
			{/* Mobile Header */}
			<div className="md:hidden fixed top-0 left-0 right-0 bg-[var(--color-stage-background)] border-b border-white/10 px-4 py-3 z-50">
				<div className="flex items-center justify-between">
					{/* Left side: G icon + Stage */}
					<div className="flex items-center gap-2">
						<GiselleIcon className="text-white-900 w-6 h-6" />
						<span className="text-white-900 text-lg font-semibold">Stage</span>
					</div>

					{/* Right side: Icons */}
					<div className="flex items-center gap-4">
						{isClientMounted && (
							<button
								type="button"
								className="text-white-700 hover:text-white-900 transition-colors"
							>
								<Bell className="w-5 h-5" />
							</button>
						)}
						{user && (
							<AvatarImage
								className="w-8 h-8 rounded-full"
								avatarUrl={user.avatarUrl ?? null}
								width={32}
								height={32}
								alt={user.displayName || user.email || "User"}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Desktop Sidebar */}

			<div
				className={clsx(
					"hidden md:flex h-screen bg-[var(--color-stage-background)] flex-col border-r border-white/10 transition-all duration-300",
					isCollapsed ? "w-[48px]" : "w-[200px]",
				)}
			>
				{/* Header Section */}
				<div className={clsx("py-2", isCollapsed ? "px-2" : "px-4")}>
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
						{menuItems.map((item) =>
							item.active ? (
								<div
									key={item.label}
									className={clsx("pt-0.5 pb-3", isCollapsed ? "px-2" : "px-4")}
								>
									<Link href={item.href}>
										<Button
											variant="glass"
											size="large"
											className={clsx(
												"w-full px-0",
												isCollapsed ? "justify-center" : "justify-start",
											)}
										>
											<div
												className={clsx(
													"flex items-center",
													isCollapsed ? "justify-center" : "gap-3 px-4",
												)}
											>
												<item.icon className="w-5 h-5" />
												{!isCollapsed && (
													<span className="text-[14px]">{item.label}</span>
												)}
											</div>
										</Button>
									</Link>
								</div>
							) : (
								<Link
									key={item.label}
									href={item.href}
									className={clsx(
										"flex items-center text-sm transition-colors",
										isCollapsed
											? "justify-center px-2 py-3"
											: "gap-3 px-4 py-3",
										"text-[color:var(--color-text-nav-inactive)] hover:text-[color:var(--color-text-nav-active)]",
									)}
								>
									{renderIcon(item.icon, item.label)}
									{!isCollapsed && <span>{item.label}</span>}
								</Link>
							),
						)}
					</nav>
				</div>

				{/* Bottom Section */}
				<div className="py-4">{bottomItems.map(renderBottomItem)}</div>
			</div>

			{/* Mobile Bottom Navigation */}
			<div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-stage-background)] border-t border-white/10 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
				<div className="flex items-center justify-around max-w-md mx-auto">
					{/* Lobby */}
					<Link
						href="/apps"
						className="flex items-center justify-center p-3 text-white-700 hover:text-white-900 transition-colors"
					>
						<Home className="w-5 h-5" />
					</Link>

					{/* Showcase */}
					<Link
						href="/showcase"
						className="flex items-center justify-center p-3 text-white-700 hover:text-white-900 transition-colors"
					>
						<Library className="w-5 h-5" />
					</Link>

					{/* New Task (Center/Prominent) */}
					<Link href="/stage">
						<Button variant="glass" size="large" className="rounded-full p-3">
							<Sparkles className="w-6 h-6" />
						</Button>
					</Link>

					{/* Tasks */}
					<Link
						href="/stage/acts"
						className="flex items-center justify-center p-3 text-white-700 hover:text-white-900 transition-colors"
					>
						<WilliIcon className="w-5 h-5" />
					</Link>

					{/* Settings */}
					<Link
						href="/settings/account"
						className="flex items-center justify-center p-3 text-white-700 hover:text-white-900 transition-colors"
					>
						<Settings className="w-5 h-5" />
					</Link>
				</div>
			</div>
		</>
	);
}
