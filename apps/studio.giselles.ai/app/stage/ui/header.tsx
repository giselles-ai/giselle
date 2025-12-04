"use client";

import Link from "next/link";
import { Suspense, use } from "react";
import { Button } from "@/app/(main)/settings/components/button";
import { GiselleLogo } from "@/components/giselle-logo";
import { upgradeCurrentTeam } from "@/services/teams/actions/upgrade-current-team";
import { TeamCreationForm } from "@/services/teams/components/team-creation-form";
import { TeamSelectionForm } from "@/services/teams/components/team-selection-form";
import { NavigationRailFooterMenu } from "./navigation-rail/navigation-rail-footer-menu";
import type { UserDataForNavigationRail } from "./navigation-rail/types";

export function Header({
	dataLoader,
}: {
	dataLoader: Promise<UserDataForNavigationRail>;
}) {
	const user = use(dataLoader);
	const isPro = user.currentTeam.isPro;

	return (
		<header className="fixed top-0 left-0 right-0 h-[48px] border-b border-border z-30 flex items-center justify-between px-4 bg-background">
			{/* Left side: Logo + Team Selection */}
			<div className="flex items-center gap-[3px]">
				<Link href="/" aria-label="Go to home" className="group">
					<GiselleLogo className="h-[24px] w-auto fill-inverse group-hover:fill-primary-100 transition-colors" />
				</Link>
				<span className="text-inverse/20 text-[18px] font-[250] leading-none ml-[4px]">
					/
				</span>
				{user.allTeams && (
					<TeamSelectionForm
						allTeams={user.allTeams}
						currentTeam={user.currentTeam}
						teamCreation={
							<TeamCreationForm
								canCreateFreeTeam={user.canCreateFreeTeam}
								proPlanPrice="$20"
							>
								<span className="text-inverse font-medium text-[14px] leading-[20.4px] font-sans">
									Create team
								</span>
							</TeamCreationForm>
						}
						triggerClassName="max-w-none"
					/>
				)}
			</div>

			{/* Right side: Upgrade + Docs + News + User Menu */}
			<div className="flex items-center gap-4">
				{!isPro && (
					<form className="flex items-center">
						<Button
							className="px-4 py-2 text-sm font-medium text-white bg-primary-900 hover:bg-primary-900/80 rounded-lg transition-colors"
							formAction={upgradeCurrentTeam}
						>
							Upgrade
						</Button>
					</form>
				)}
				<Link
					href="https://docs.giselles.ai/en/guides/introduction"
					target="_blank"
					rel="noopener"
					className="text-link-muted hover:text-accent text-sm transition-colors"
				>
					Docs
				</Link>
				<Link
					href="https://docs.giselles.ai/en/releases/release-notes"
					target="_blank"
					rel="noopener"
					className="text-link-muted hover:text-accent text-sm transition-colors flex items-center gap-1"
				>
					News
				</Link>
				<Suspense
					fallback={
						<div className="w-8 h-8 bg-black-800 animate-pulse rounded-full" />
					}
				>
					<HeaderUserMenu user={dataLoader} />
				</Suspense>
			</div>
		</header>
	);
}

function HeaderUserMenu({
	user: userPromise,
}: {
	user: Promise<UserDataForNavigationRail>;
}) {
	return (
		<div className="flex items-center">
			<NavigationRailFooterMenu user={userPromise} variant="expanded" />
		</div>
	);
}
