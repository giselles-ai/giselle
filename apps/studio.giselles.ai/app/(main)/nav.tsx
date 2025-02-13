"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC } from "react";

export const Nav: FC = () => {
	const pathname = usePathname();

	return (
		<div className="gap-[16px] text-[18px] font-rosart flex text-black-70">
			<p className="text-black--30">
				{pathname === "/"
					? "Lobby"
					: pathname.startsWith("/agents")
						? "Agents"
						: pathname.startsWith("/settings")
							? "Settings"
							: ""}
			</p>
			<p>/</p>
			{/** pathname !== "/" && <Link href="/">Lobby</Link> */}
			{!pathname.startsWith("/agents") && <Link href="/agents">Agents</Link>}
			{!pathname.startsWith("/settings") && (
				<Link href="/settings/account">Settings</Link>
			)}
		</div>
	);
};
