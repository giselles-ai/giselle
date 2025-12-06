import Link from "next/link";
import { Suspense } from "react";
import { GiselleLogo } from "@/components/giselle-logo";
import { AccountMenu, loadCurrentUser } from "./account-menu";
import { getTeamContext, TeamSwitcher } from "./team-switcher";
import { getUpgradeButtonContext, UpgradeButton } from "./upgrade-button";

export function Header() {
	return (
		<header className="h-[48px] shrink-0 border-b border-border flex items-center justify-between px-4 bg-background">
			{/* Left side: Logo + Team Selection */}
			<div className="flex items-center gap-[3px]">
				<Link href="/" aria-label="Go to home" className="group">
					<GiselleLogo className="h-[24px] w-auto fill-inverse group-hover:fill-primary-100 transition-colors" />
				</Link>
				<span className="text-inverse/20 text-[18px] font-[250] leading-none ml-[4px]">
					/
				</span>

				<Suspense
					fallback={
						<div className="w-24 h-6 bg-inverse/20 animate-pulse rounded-md" />
					}
				>
					<TeamSwitcher getTeamContext={getTeamContext()} />
				</Suspense>
			</div>

			{/* Right side: Upgrade + Docs + News + User Menu */}
			<div className="flex items-center gap-4">
				<Suspense
					fallback={
						<div className="w-16 h-6 bg-inverse/20 animate-pulse rounded-md" />
					}
				>
					<UpgradeButton
						getUpgradeButtonContextPromise={getUpgradeButtonContext()}
					/>
				</Suspense>
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
				<div className="flex items-center">
					<Suspense
						fallback={
							<div className="w-8 h-8 bg-inverse/20 animate-pulse rounded-full" />
						}
					>
						<AccountMenu currentUserPromise={loadCurrentUser()} />
					</Suspense>
				</div>
			</div>
		</header>
	);
}
