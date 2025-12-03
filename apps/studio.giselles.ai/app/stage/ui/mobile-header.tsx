"use client";

import { BellIcon, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense, use, useEffect, useMemo, useRef, useState } from "react";
import { GiselleLogo } from "@/components/giselle-logo";
import { navigationItems } from "./navigation-rail/navigation-items";
import { NavigationList } from "./navigation-rail/navigation-list";
import { NavigationListItem } from "./navigation-rail/navigation-list-item";
import { NavigationRailFooterMenu } from "./navigation-rail/navigation-rail-footer-menu";
import { TeamSelectionCompact } from "./navigation-rail/team-selection-compact";
import type { UserDataForNavigationRail } from "./navigation-rail/types";

const stageOnlyItemIds = new Set([
	"section-agent",
	"nav-stage",
	"nav-showcase",
	"nav-task",
	"nav-action-history",
]);

type MobileHeaderProps = {
	dataLoader: Promise<UserDataForNavigationRail>;
	teamSelectionSlot?: ReactNode;
};

export function MobileHeader({
	dataLoader,
	teamSelectionSlot,
}: MobileHeaderProps) {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const pathname = usePathname();
	const data = use(dataLoader);
	const prevPathnameRef = useRef(pathname);

	// Close drawer when pathname changes
	useEffect(() => {
		if (prevPathnameRef.current !== pathname) {
			setIsDrawerOpen(false);
			prevPathnameRef.current = pathname;
		}
	});

	return (
		<>
			<div
				className="md:hidden fixed top-0 left-0 right-0 border-b border-border px-4 z-30 h-16 flex items-center justify-between"
				style={{ backgroundColor: "var(--color-background)" }}
			>
				{/* Left side: Menu button + Giselle Logo */}
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={() => setIsDrawerOpen(true)}
						className="text-white-700 hover:text-inverse transition-colors p-1"
						aria-label="Open menu"
					>
						<Menu className="w-5 h-5" />
					</button>
					<Link href="/" aria-label="Go to home" className="group">
						<GiselleLogo className="w-[70px] h-auto fill-inverse group-hover:fill-primary-100 transition-colors" />
					</Link>
				</div>

				{/* Right side: Icons */}
				<div className="flex items-center gap-4">
					<button
						type="button"
						className="text-white-700 hover:text-inverse transition-colors"
					>
						<BellIcon className="w-5 h-5" />
					</button>
				</div>
			</div>
			<div className="md:hidden h-16 w-full" />

			{/* Mobile Drawer */}
			<AnimatePresence>
				{isDrawerOpen && (
					<>
						{/* Overlay */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setIsDrawerOpen(false)}
							className="fixed inset-0 bg-black/50 z-40 md:hidden"
						/>
						{/* Drawer */}
						<motion.div
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={{ type: "spring", damping: 25, stiffness: 200 }}
							className="fixed top-0 left-0 bottom-0 w-[320px] max-w-[85vw] border-r border-border z-50 md:hidden flex flex-col overflow-y-auto"
							style={{ backgroundColor: "var(--color-background)" }}
						>
							<MobileDrawerContent
								dataLoader={dataLoader}
								teamSelectionSlot={teamSelectionSlot}
								currentPath={pathname}
								enableStage={data.enableStage}
								onClose={() => setIsDrawerOpen(false)}
							/>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}

function MobileDrawerContent({
	dataLoader,
	teamSelectionSlot,
	currentPath,
	enableStage,
	onClose,
}: {
	dataLoader: Promise<UserDataForNavigationRail>;
	teamSelectionSlot?: ReactNode;
	currentPath?: string;
	enableStage: boolean;
	onClose: () => void;
}) {
	const filteredItems = useMemo(() => {
		return enableStage
			? navigationItems
			: navigationItems.filter((item) => !stageOnlyItemIds.has(item.id));
	}, [enableStage]);

	return (
		<>
			{/* Header */}
			<div className="px-4 h-16 flex items-center justify-between border-b border-border">
				<Link href="/" aria-label="Go to home" className="group">
					<GiselleLogo className="w-[70px] h-auto fill-inverse group-hover:fill-primary-100 transition-colors" />
				</Link>
				<button
					type="button"
					onClick={onClose}
					className="text-white-700 hover:text-inverse transition-colors p-1"
					aria-label="Close menu"
				>
					<X className="w-5 h-5" />
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto px-4 py-4">
				<div className="my-2 px-0 w-full">
					{teamSelectionSlot ?? (
						<TeamSelectionCompact userPromise={dataLoader} />
					)}
				</div>
				<NavigationList>
					{filteredItems.map((navigationItem) => {
						return (
							<NavigationListItem
								key={navigationItem.id}
								{...navigationItem}
								variant="expanded"
								currentPath={currentPath}
							/>
						);
					})}
				</NavigationList>
			</div>

			{/* Footer */}
			<div className="border-t border-border px-4 py-4">
				<Suspense
					fallback={
						<div className="w-full bg-black-800 animate-pulse h-full rounded-md" />
					}
				>
					<NavigationRailFooterMenu user={dataLoader} variant="expanded" />
				</Suspense>
			</div>
		</>
	);
}
