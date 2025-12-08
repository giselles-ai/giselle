"use client";

import { CheckIcon, LoaderIcon } from "lucide-react";
import { useTransition } from "react";
import { FreeTag } from "@/components/free-tag";
import { ProTag } from "@/components/pro-tag";
import { TeamAvatarImage } from "./team-avatar-image";

export function TeamSwitchButton({
	id,
	name,
	avatarUrl,
	isPro,
	isCurrentTeam,
	changeTeamAction,
}: {
	id: string;
	name: string;
	avatarUrl: string | null;
	isPro: boolean;
	isCurrentTeam: boolean;
	changeTeamAction: (teamId: string) => Promise<void>;
}) {
	const [pending, startTransition] = useTransition();
	return (
		<button
			type="button"
			className="relative flex w-full cursor-default select-none items-center rounded-lg p-1.5 pl-2 pr-8 text-sm outline-hidden hover:bg-white/5 font-geist"
			onClick={() => {
				startTransition(async () => {
					await changeTeamAction(id);
				});
			}}
		>
			<div className="flex items-center gap-1.5 w-full justify-start">
				<TeamAvatarImage
					avatarUrl={avatarUrl}
					teamName={name}
					width={32}
					height={32}
					className="w-8 h-8 shrink-0"
					alt={name}
				/>
				<span className="truncate max-w-[140px] text-[14px] font-geist text-inverse">
					{name}
				</span>
				{isPro ? <ProTag /> : <FreeTag />}
			</div>
			{isCurrentTeam && (
				<span className="absolute right-2 left-auto flex h-3.5 w-3.5 items-center justify-center">
					<CheckIcon className="h-4 w-6" />
				</span>
			)}
			{pending && (
				<span className="absolute right-2 left-auto flex h-3.5 w-3.5 items-center justify-center">
					<LoaderIcon className="h-4 w-6 animate-spin" />
				</span>
			)}
		</button>
	);
}
