"use client";

import clsx from "clsx/lite";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FreeTag } from "@/components/free-tag";
import { ProTag } from "@/components/pro-tag";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
} from "@/components/ui/select";
import { selectTeam } from "../actions/select-team";
import type { Team } from "../types";
import { TeamAvatarImage } from "./team-avatar-image";

type TeamSelectionFormProps = {
	allTeams: Team[];
	currentTeam: Team;
	teamCreation: React.ReactNode;
	triggerClassName?: string;
};

export function TeamSelectionForm({
	allTeams,
	currentTeam,
	teamCreation,
	triggerClassName,
}: TeamSelectionFormProps) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const action = (formData: FormData) => {
		return selectTeam(formData, false);
	};

	const formRef = useRef<HTMLFormElement>(null);

	if (!mounted) return null; // avoid hydration mismatches from Radix ids

	return (
		<form action={action} ref={formRef} key={currentTeam.id} className="w-full">
			<Select
				name="teamId"
				defaultValue={currentTeam.id}
				onValueChange={() => {
					formRef.current?.requestSubmit();
				}}
			>
				<SelectTrigger
					className={clsx(
						"w-full border-0 flex justify-between items-center data-[state=open]:border-0 data-[state=open]:ring-0 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 outline-none pt-[2px] pr-[8px] pb-[2px] pl-[12px] bg-transparent",
						triggerClassName,
					)}
				>
					<div className="flex items-center gap-[6px] flex-1 min-w-0">
						<TeamAvatarImage
							avatarUrl={currentTeam.avatarUrl}
							teamName={currentTeam.name}
							width={16}
							height={16}
							className="shrink-0"
							alt={currentTeam.name}
						/>
						<span
							className="text-inverse text-[14px] font-medium overflow-hidden text-ellipsis whitespace-nowrap"
							title={currentTeam.name}
						>
							{currentTeam.name}
						</span>
						{currentTeam.isPro !== undefined &&
							(currentTeam.isPro ? <ProTag /> : <FreeTag />)}
					</div>
					<div className="pl-3 ml-auto flex-none">
						<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 hover:bg-white/10 hover:opacity-100 hover:rounded-md hover:p-0.5" />
					</div>
				</SelectTrigger>
				<SelectContent className="p-2">
					<div className="py-1">
						{allTeams.map((team) => (
							<SelectItem
								key={team.id}
								value={team.id}
								className="relative flex w-full cursor-default select-none items-center rounded-lg p-1.5 pl-2 pr-8 text-sm outline-hidden focus:bg-white/5 font-geist data-disabled:pointer-events-none data-disabled:opacity-50 [&>span:first-child]:absolute [&>span:first-child]:right-2 [&>span:first-child]:left-auto"
							>
								<div className="flex items-center gap-1.5 w-full">
									<TeamAvatarImage
										avatarUrl={team.avatarUrl}
										teamName={team.name}
										width={32}
										height={32}
										className="w-8 h-8 shrink-0"
										alt={team.name}
									/>
									<span
										className="truncate max-w-[140px] text-[14px] font-geist text-inverse flex-1"
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

					<SelectSeparator className="bg-white/10" />

					<div className="px-2 py-1.5 flex items-center gap-x-2 rounded-lg w-full hover:bg-white/5">
						<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
							<Plus className="size-3 text-background" />
						</span>
						<span className="text-inverse font-medium text-[14px] leading-[14px] font-geist">
							{teamCreation}
						</span>
					</div>
				</SelectContent>
			</Select>
		</form>
	);
}
