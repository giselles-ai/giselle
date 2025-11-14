"use client";

import Link from "next/link";
import { use } from "react";
import { TeamAvatarImage } from "@/services/teams/components/team-avatar-image";
import type { UserDataForNavigationRail } from "./types";

export function TeamAvatarCompact({
	userPromise,
}: {
	userPromise: Promise<UserDataForNavigationRail>;
}) {
	const user = use(userPromise);
	const team = user.currentTeam;
	return (
		<div className="w-full flex justify-center my-2">
			<Link href="/settings/team" className="inline-flex">
				<TeamAvatarImage
					avatarUrl={team.avatarUrl ?? null}
					teamName={team.name}
					width={28}
					height={28}
					className="w-7 h-7"
					alt={team.name}
				/>
			</Link>
		</div>
	);
}
