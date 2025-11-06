import { DocsLink } from "@giselle-internal/ui/docs-link";
import Link from "next/link";
import { GiselleLogo } from "@/components/giselle-logo";
import { UserButton } from "@/services/accounts/components";
import { TeamSelection } from "@/services/teams/components/team-selection";
import { Nav } from "../nav";

export function Header() {
	return (
		<header className="flex flex-col bg-bg">
			<div className="h-header flex items-center px-page justify-between">
				<div className="flex items-center gap-2">
					<Link href="/" aria-label="Giselle logo">
						<GiselleLogo className="w-logo h-auto fill-white mt-[4px]" />
					</Link>
					<span className="text-link-muted">/</span>
					<TeamSelection />
				</div>
				<div className="flex items-center gap-4">
					<DocsLink
						href="https://docs.giselles.ai/en/guides/introduction"
						target="_blank"
						rel="noopener noreferrer"
					>
						Docs
					</DocsLink>
					<UserButton />
				</div>
			</div>

			<Nav />
			<div className="h-[1px] w-full bg-border" />
		</header>
	);
}
