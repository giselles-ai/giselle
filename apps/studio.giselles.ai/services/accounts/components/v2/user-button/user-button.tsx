import { getAccountInfo } from "@/app/(main)/settings/account/actions";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TeamCreation from "@/services/teams/components/v2/team-creation";
import Avatar from "boring-avatars";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { FC } from "react";
import { SignOutButton } from "../../v2/user-button/sign-out-button";

export const UserButton: FC = async () => {
	// TODO: This button need to implement after users schema migrations
	// const { displayName, email, avatarUrl } = await getAccountInfo();
	const { displayName, email } = await getAccountInfo();
	const alt = displayName || email || "";
	const avatarUrl = null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="cursor-pointer">
				{avatarUrl ? (
					<Image
						src={avatarUrl}
						alt={alt}
						className="w-9 h-9 rounded-full"
						width={36}
						height={36}
					/>
				) : (
					<Avatar
						name={alt}
						variant="marble"
						size={36}
						colors={["#413e4a", "#73626e", "#b38184", "#f0b49e", "#f7e4be"]}
					/>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="flex flex-col gap-y-2 p-2 border-[0.5px] border-black-400 bg-black-900"
			>
				<DropdownMenuLabel className="flex flex-col px-2 pt-2 text-white-400">
					<span className="font-bold text-[16px] leading-[16px] font-hubot">
						{displayName || "No display name"}
					</span>
					<span className="font-medium leading-[20.4px] font-geist">
						{email}
					</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="-mx-2 my-0 bg-black-400" />
				<div>
					<DropdownMenuItem className="p-0 rounded-[8px] focus:bg-primary-900/50">
						<Link
							href="/settings/account"
							className="block p-2 w-full text-white-900 font-medium text-[12px] leading-[20.4px] font-geist"
						>
							Account Settings
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
							<span className="text-white-900 font-medium text-[12px] leading-[20.4px] font-geist">
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
							className="block p-2 w-full text-white-900 font-medium text-[12px] leading-[20.4px] font-geist"
							rel="noreferrer"
						>
							Home Page
						</a>
					</DropdownMenuItem>
					<DropdownMenuItem className="p-0 rounded-[8px] focus:bg-primary-900/50">
						<SignOutButton className="block p-2 w-full text-left">
							Log Out
						</SignOutButton>
					</DropdownMenuItem>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
