import { getAccountInfo } from "@/app/(main)/settings/account/actions";
import { Button } from "@/app/(main)/settings/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	type CurrentTeam,
	fetchCurrentTeam,
	isProPlan,
} from "@/services/teams";
import { upgradeTeam } from "@/services/teams/actions/upgrade-team";
import TeamCreation from "@/services/teams/components/team-creation";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";
import { AvatarImage } from "./avatar-image";
import { SignOutButton } from "./sign-out-button";

export const UserButton: FC = async () => {
	const { displayName, email, avatarUrl } = await getAccountInfo();
	const alt = displayName || email || "";
	const currentTeam = await fetchCurrentTeam();
	const isPro = isProPlan(currentTeam);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="cursor-pointer" aria-label="Profile menu">
				<AvatarImage
					className="w-9 h-9 rounded-full"
					avatarUrl={avatarUrl}
					width={36}
					height={36}
					alt={alt}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="p-2 border-[0.5px] border-white/10 rounded-xl shadow-[0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)] bg-black-900/50 backdrop-blur-md"
			>
				<DropdownMenuLabel className="flex flex-col px-2 pt-2 pb-1 text-white-400">
					<span className="font-bold text-[16px] leading-[16px] font-geist">
						{displayName || "No display name"}
					</span>
					<span className="font-medium leading-[20.4px] font-geist text-black-600">
						{email}
					</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="bg-white/10" />
				<div className="py-1 space-y-1">
					<DropdownMenuItem className="p-0 rounded-lg focus:bg-white/5" asChild>
						<Link
							href="/settings/account"
							className="block px-2 py-1.5 w-full text-white-400 font-medium text-[14px] leading-[14px] font-geist"
							aria-label="Account settings"
						>
							Account Settings
						</Link>
					</DropdownMenuItem>
					<TeamCreation>
						<button
							type="button"
							className="flex items-center gap-x-2 px-2 py-1.5 rounded-lg w-full hover:bg-white/5"
						>
							<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
								<Plus className="size-3 text-black-900" />
							</span>
							<span className="text-white-400 font-medium text-[14px] leading-[14px] font-geist">
								Create team
							</span>
						</button>
					</TeamCreation>
				</div>
				<DropdownMenuSeparator className="bg-white/10" />
				<div className="py-1 space-y-1">
					<DropdownMenuItem className="p-0 rounded-lg focus:bg-white/5">
						<a
							href="https://giselles.ai/"
							target="_blank"
							className="block px-2 py-1.5 w-full text-white-400 font-medium text-[14px] leading-[14px] font-geist"
							rel="noreferrer"
						>
							Home Page
						</a>
					</DropdownMenuItem>
					<DropdownMenuItem className="p-0 rounded-lg focus:bg-white/5">
						<SignOutButton className="block px-2 py-1.5 w-full text-left text-white-400 font-geist text-[14px] leading-[14px]">
							Log Out
						</SignOutButton>
					</DropdownMenuItem>
				</div>
				{!isPro && (
					<div>
						<DropdownMenuItem className="p-0 rounded-lg">
							<form className="w-full">
								<UpgradeButton team={currentTeam} />
							</form>
						</DropdownMenuItem>
					</div>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

function UpgradeButton({ team }: { team: CurrentTeam }) {
	const upgradeTeamWithTeam = upgradeTeam.bind(null, team);

	return (
		<Button
			className="block p-2 w-full text-center font-medium text-[14px] leading-[20.4px] font-geist text-white bg-primary-900 hover:bg-primary-900/80 rounded-lg transition-colors"
			formAction={upgradeTeamWithTeam}
		>
			Upgrade to Pro
		</Button>
	);
}
