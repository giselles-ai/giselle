import Link from "next/link";
import type { ReactNode } from "react";
import { GiselleLogo } from "@/components/giselle-logo";
import { UserButton } from "@/services/accounts/components";

export default function StageLayout({ children }: { children: ReactNode }) {
	return (
		<div className="h-screen flex flex-col bg-black-900">
			<header className="h-[50px] flex items-center justify-between px-[24px]">
				<div className="flex items-center gap-2">
					<Link href="/" aria-label="Giselle logo">
						<GiselleLogo className="w-[70px] h-auto fill-white" />
					</Link>
					<span className="text-[18px] font-sans text-white-100">Stage</span>
				</div>
				<div className="flex items-center gap-4">
					<Link
						href="https://docs.giselles.ai/guides/introduction"
						target="_blank"
						rel="noopener noreferrer"
						className="text-[14px] font-sans font-medium text-black-70 hover:text-white-100"
					>
						Docs
					</Link>
					<UserButton />
				</div>
			</header>
			<div className="h-[1px] w-full bg-black-70/50" />
			<main className="flex-1 overflow-y-auto">{children}</main>
		</div>
	);
}
