"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { NavigationRailCollapsed } from "./navigation-rail-collapsed";
import { NavigationRailExpanded } from "./navigation-rail-expanded";
import type { NavigationRailState, UserDataForNavigationRail } from "./types";

export function NavigationRail({
	user: userPromise,
}: {
	user: Promise<UserDataForNavigationRail>;
}) {
	const [state, setState] = useState<NavigationRailState>("expanded");
	const spacingAnimationControls = useMemo(() => {
		switch (state) {
			case "collapsed":
				return {
					width: "var(--spacing-navigation-rail-collapsed)",
				};
			case "expanded":
				return {
					width: "var(--spacing-navigation-rail-expanded)",
				};
			default: {
				const _exhaustiveCheck: never = state;
				throw new Error(`Unhandled state: ${_exhaustiveCheck}`);
			}
		}
	}, [state]);
	return (
		<>
			<AnimatePresence initial={false}>
				{state === "expanded" && (
					<motion.div
						className="hidden md:block fixed top-0 left-0 h-full"
						exit={{
							opacity: 0,
							width: "var(--spacing-navigation-rail-collapsed)",
						}}
						initial={{
							opacity: 0,
							width: "var(--spacing-navigation-rail-collapsed)",
						}}
						animate={{
							opacity: 1,
							width: "var(--spacing-navigation-rail-expanded)",
						}}
					>
						<NavigationRailExpanded
							user={userPromise}
							onCollapseButtonClick={() => setState("collapsed")}
						/>
					</motion.div>
				)}
			</AnimatePresence>
			<AnimatePresence initial={false}>
				{state === "collapsed" && (
					<motion.div
						className="hidden md:block fixed top-0 left-0 h-full"
						initial={{
							opacity: 1,
							width: "var(--spacing-navigation-rail-collapsed)",
						}}
						exit={{
							opacity: 0,
							width: "var(--spacing-navigation-rail-collapsed)",
						}}
						animate={{
							opacity: 1,
							width: "var(--spacing-navigation-rail-collapsed)",
						}}
					>
						<NavigationRailCollapsed
							user={userPromise}
							onExpandButtonClick={() => setState("expanded")}
						/>
					</motion.div>
				)}
			</AnimatePresence>
			<motion.div
				initial={{
					width: "var(--spacing-navigation-rail-expanded)",
				}}
				animate={spacingAnimationControls}
				className="border-r border-border"
			/>
		</>
	);
}
