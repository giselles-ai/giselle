import { getAccountInfo } from "@/app/(main)/settings/account/actions";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getUser } from "@/lib/supabase";
import Avatar from "boring-avatars";
import Link from "next/link";
import type { FC } from "react";
import { SignOutButton } from "../../v2/user-button/sign-out-button";

export const UserButton: FC = async () => {
	const user = await getUser();
	const { displayName } = await getAccountInfo();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="cursor-pointer">
				<Avatar
					name={user.email}
					variant="marble"
					size={36}
					colors={["#413e4a", "#73626e", "#b38184", "#f0b49e", "#f7e4be"]}
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
					<span className="font-medium leading-[20.4px] font-geist">
						{user.email}
					</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="-mx-2 my-0 bg-black-400" />
				<DropdownMenuItem className="p-0 rounded-[8px] focus:bg-primary-900/50">
					<Link
						href="/settings/account"
						className="block p-2 w-full text-white-900 font-medium text-[12px] leading-[20.4px] font-geist"
					>
						Account Settings
					</Link>
				</DropdownMenuItem>
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
