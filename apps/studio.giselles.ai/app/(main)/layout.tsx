import { GiselleLogo } from "@/components/giselle-logo";
import { UserButton } from "@/services/accounts/components";
import { TeamSelection } from "@/services/teams/components/team-selection";
import Link from "next/link";
import type { ReactNode } from "react";
import { Nav } from "./nav";

export default async function Layout({ children }: { children: ReactNode }) {
	return (
		<div className="h-screen overflow-y-hidden bg-black-900 flex flex-col">
			<header className="flex flex-col">
				{/* 上の行: ロゴ、チーム選択、ユーザーアイコン */}
				<div className="h-[50px] flex items-center px-[24px] justify-between">
					<div className="flex items-center gap-2">
						<Link href="/">
							<GiselleLogo className="w-[70px] h-auto fill-white mt-[4px]" />
						</Link>
						<span className="text-black-70">/</span>
						<TeamSelection />
					</div>
					<div className="flex items-center gap-4">
						<Link
							href="https://docs.giselles.ai/guides/introduction"
							target="_blank"
							rel="noopener noreferrer"
							className="text-[16px] font-hubot font-medium text-black-70 hover:text-white-100"
						>
							Docs
						</Link>
						<UserButton />
					</div>
				</div>

				{/* 下の行: メインナビゲーション */}
				<div className="flex items-center px-[24px] py-0 border-t border-black-900/50">
					<Nav />
				</div>

				{/* ナビゲーションの下の罫線 */}
				<div className="h-[1px] w-full bg-black-800" />
			</header>
			<main className="flex-1 overflow-y-auto">{children}</main>
		</div>
	);
}
