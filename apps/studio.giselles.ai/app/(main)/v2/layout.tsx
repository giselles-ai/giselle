import { GiselleLogo } from "@/components/giselle-logo";
import { TeamSelection } from "@/services/teams/components/team-selection";
import Link from "next/link";
import type { ReactNode } from "react";
import { UserButton } from "../../../services/accounts/components/v2/user-button/user-button";
import { Nav } from "./nav";

export default async function LayoutV2({ children }: { children: ReactNode }) {
	return (
		<div className="h-screen overflow-y-hidden bg-black-900 divide-y divide-black-80 flex flex-col">
			<header className="h-[60px] flex items-center px-[24px] justify-between">
				<div className="flex">
					<Link href="/">
						<GiselleLogo className="w-[70px] h-auto fill-white mt-[4px] mr-[8px]" />
					</Link>
					<Nav />
				</div>
				<div className="flex items-center gap-4">
					<TeamSelection />
					<UserButton />
				</div>
			</header>
			<main className="flex-1 overflow-y-auto">{children}</main>
		</div>
	);
}
