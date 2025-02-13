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
import { SignOutButton } from "./sign-out-button";

export const UserButton: FC = async () => {
	const user = await getUser();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Avatar
					name={user.email}
					variant="marble"
					size={36}
					colors={["#413e4a", "#73626e", "#b38184", "#f0b49e", "#f7e4be"]}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>{user.email}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="justify-end">
					<Link href="/settings/account">Settings</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="justify-end">
					<SignOutButton />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
