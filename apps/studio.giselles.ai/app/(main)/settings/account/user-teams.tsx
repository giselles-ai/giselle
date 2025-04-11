"use client";

import { FreeTag } from "@/components/free-tag";
import { ProTag } from "@/components/pro-tag";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search } from "lucide-react";
import { useState } from "react";

const roles = {
	admin: "Admin",
	member: "Member",
};

export default function UserTeams({
	teams,
}: {
	teams: {
		id: string;
		name: string;
		role: "admin" | "member";
		isPro?: boolean;
	}[];
}) {
	const [teamName, setTeamName] = useState("");

	const handleChangeTeamName = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTeamName(e.target.value);
	};

	const filteredTeams = teams.filter((team) =>
		team.name.toLowerCase().includes(teamName.toLowerCase()),
	);

	return (
		<>
			<div className="flex items-center gap-x-[11px] py-2 px-3 border-[0.5px] border-black-820/50 rounded-[8px] bg-black-350/20">
				<Search className="size-6 text-black-400" />
				<input
					onChange={handleChangeTeamName}
					type="text"
					defaultValue={teamName}
					placeholder="Search for a team..."
					className="w-full text-white-900 font-medium text-[14px] leading-[23.8px] font-geist placeholder:text-black-400"
				/>
			</div>
			<div className="border-[0.5px] border-black-400 rounded-[8px] divide-y divide-black-400">
				{filteredTeams.map((team) => (
					<UserTeamsItem
						key={team.id}
						teamId={team.id}
						teamName={team.name}
						role={roles[team.role]}
						isPro={team.isPro}
					/>
				))}
			</div>
		</>
	);
}

function UserTeamsItem({
	teamId,
	teamName,
	role,
	isPro = false,
}: {
	teamId: string;
	teamName: string;
	role: string;
	isPro?: boolean;
}) {
	return (
		<div className="flex items-center justify-between gap-4 p-4 bg-black-400/10">
			<div className="flex flex-col">
				<div className="flex items-center gap-2">
					<div className="text-white-400 font-medium text-[16px] leading-[22.4px] font-geist">
						{teamName}
					</div>
					{isPro ? <ProTag /> : <FreeTag />}
				</div>
				<div className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
					{role}
				</div>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex items-center justify-center p-2 rounded-[4px] hover:bg-black-300/30 focus:outline-none"
						aria-label="Team menu"
					>
						<MoreHorizontal className="size-5 text-black-600" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="p-2 border-[0.5px] border-black-400 bg-black-900"
				>
					<DropdownMenuItem className="p-0 rounded-[8px] focus:bg-primary-900/50">
						<button
							type="button"
							className="flex items-center gap-x-2 p-2 rounded-[8px] w-full hover:bg-primary-900/50 text-white-400 font-medium text-[14px] leading-[20.4px] font-hubot"
						>
							Apps
						</button>
					</DropdownMenuItem>
					<DropdownMenuItem className="p-0 rounded-[8px] focus:bg-primary-900/50">
						<button
							type="button"
							className="flex items-center gap-x-2 p-2 rounded-[8px] w-full hover:bg-primary-900/50 text-white-400 font-medium text-[14px] leading-[20.4px] font-hubot"
						>
							Settings
						</button>
					</DropdownMenuItem>
					<DropdownMenuItem className="p-0 rounded-[8px] focus:bg-primary-900/50">
						<button
							type="button"
							className="flex items-center gap-x-2 p-2 rounded-[8px] w-full hover:bg-primary-900/50 text-error-900 font-medium text-[14px] leading-[20.4px] font-hubot"
						>
							Leave team
						</button>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
