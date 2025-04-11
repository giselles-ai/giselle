"use client";

import { FreeTag } from "@/components/free-tag";
import { ProTag } from "@/components/pro-tag";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
} from "@/components/ui/select";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useRef } from "react";
import { selectTeam } from "../actions/select-team";
import type { Team } from "../types";

type TeamSelectionFormProps = {
	allTeams: Team[];
	currentTeam: Team;
	teamCreation: React.ReactNode;
};

export function TeamSelectionForm({
	allTeams,
	currentTeam,
	teamCreation,
}: TeamSelectionFormProps) {
	const formRef = useRef<HTMLFormElement>(null);

	return (
		<form action={selectTeam} ref={formRef}>
			<Select
				name="teamId"
				defaultValue={currentTeam.id}
				onValueChange={() => {
					formRef.current?.requestSubmit();
				}}
			>
				<SelectTrigger className="w-auto min-w-[100px] max-w-[360px] border-0 flex justify-between items-center data-[state=open]:border-0 data-[state=open]:ring-0 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 outline-none focus-visible:outline-none px-0.5 py-0.5 bg-transparent">
					<div className="flex items-center gap-1.5">
						<span
							className="text-base font-hubot text-white-400 truncate max-w-[180px]"
							title={currentTeam.name}
						>
							{currentTeam.name}
						</span>
						{currentTeam.isPro !== undefined &&
							(currentTeam.isPro ? <ProTag /> : <FreeTag />)}
					</div>
					<div className="pl-3">
						<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 hover:bg-accent hover:opacity-100 hover:rounded-md hover:p-0.5" />
					</div>
				</SelectTrigger>
				<SelectContent className="flex flex-col gap-y-0 p-0 border-[0.5px] border-black-400 bg-black-900">
					<div className="p-1 space-y-1">
						{allTeams.map((team) => (
							<SelectItem
								key={team.id}
								value={team.id}
								className="p-1.5 pl-10 rounded-[8px] focus:bg-primary-900/50 font-hubot"
							>
								<div className="flex items-center gap-1.5 pr-1">
									<span
										className="truncate max-w-[180px] text-base font-hubot text-white-400"
										title={team.name}
									>
										{team.name}
									</span>
									{team.isPro !== undefined &&
										(team.isPro ? <ProTag /> : <FreeTag />)}
								</div>
							</SelectItem>
						))}
					</div>

					<SelectSeparator className="my-0 bg-black-400" />

					<div className="p-2.5 flex items-center gap-x-2 rounded-[8px] w-full hover:bg-primary-900/50">
						<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
							<Plus className="size-3 text-black-900" />
						</span>
						<span className="text-white-400 font-medium text-[14px] leading-[20.4px] font-hubot">
							{teamCreation}
						</span>
					</div>
				</SelectContent>
			</Select>
		</form>
	);
}
