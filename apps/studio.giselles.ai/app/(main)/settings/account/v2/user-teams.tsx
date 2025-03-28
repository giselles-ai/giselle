"use client";

import { Search } from "lucide-react";
import { useState } from "react";

const roles = {
	admin: "Admin",
	member: "Member",
};

export default function UserTeams({
	teams,
}: { teams: { id: string; name: string; role: "admin" | "member" }[] }) {
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
						teamName={team.name}
						role={roles[team.role]}
					/>
				))}
			</div>
		</>
	);
}

function UserTeamsItem({ teamName, role }: { teamName: string; role: string }) {
	return (
		<div className="flex items-center justify-between gap-4 p-4 bg-black-400/10">
			<div className="flex flex-col">
				<div className="text-white-400 font-medium text-[16px] leading-[22.4px] font-geist">
					{teamName}
				</div>
				<div className="text-black-400 font-medium text-[12px] leading-[20.4px] font-geist">
					{role}
				</div>
			</div>
		</div>
	);
}
