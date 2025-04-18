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
			<DropdownMenuTrigger className="cursor-pointer">
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
				className="flex flex-col gap-y-2 p-2 border-[0.5px] border-black-400 bg-black-900"
			>
				<DropdownMenuLabel className="flex flex-col px-2 pt-2 text-white-400">
					<span className="font-bold text-[16px] leading-[16px] font-hubot">
						{displayName || "No display name"}
					</span>
					<span className="font-medium leading-[20.4px] font-hubot text-black-600">
						{email}
					</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="-mx-2 my-0 bg-black-400" />
				<div>
					<DropdownMenuItem
						className="p-0 rounded-[8px] focus:bg-primary-900/50"
						asChild
					>
						<Link
							href="/settings/account"
							className="block p-2 w-full text-white-400 font-medium text-[14px] leading-[20.4px] font-hubot"
						>
							Account Preferences
						</Link>
					</DropdownMenuItem>
					<TeamCreation>
						<button
							type="button"
							className="flex items-center gap-x-2 p-2 rounded-[8px] w-full hover:bg-primary-900/50"
						>
							<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
								<Plus className="size-3 text-black-900" />
							</span>
							<span className="text-white-400 font-medium text-[14px] leading-[20.4px] font-hubot">
								Create team
							</span>
						</button>
					</TeamCreation>
				</div>
				<DropdownMenuSeparator className="-mx-2 my-0 p-0 bg-black-400" />
				<div>
					<DropdownMenuItem className="p-0 rounded-[8px] focus:bg-primary-900/50">
						<a
							href="https://giselles.ai/"
							target="_blank"
							className="block p-2 w-full text-white-400 font-medium text-[14px] leading-[20.4px] font-hubot"
							rel="noreferrer"
						>
							Home Page
						</a>
					</DropdownMenuItem>
					<DropdownMenuItem className="p-0 rounded-[8px] focus:bg-primary-900/50">
						<SignOutButton className="block p-2 w-full text-left text-white-400 font-hubot text-[14px] leading-[20.4px]">
							Log Out
						</SignOutButton>
					</DropdownMenuItem>
				</div>
				{!isPro && (
					<div>
						<DropdownMenuItem className="p-0 rounded-[8px]">
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
			className="block p-2 w-full text-center font-medium text-[14px] leading-[20.4px] font-hubot text-white bg-primary-900 hover:bg-primary-900/80 rounded-[8px] transition-colors"
			formAction={upgradeTeamWithTeam}
		>
			Upgrade to Pro
		</Button>
	);
}
