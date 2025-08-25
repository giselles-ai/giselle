"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo, useRef } from "react";
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
	currentUser: React.ReactNode;
};

export function TeamSelectionForm({
	allTeams,
	currentTeam,
	teamCreation,
	currentUser,
}: TeamSelectionFormProps) {
	const pathname = usePathname();
	const isAccontSettingPage = useMemo(
		() => pathname.startsWith("/settings/account"),
		[pathname],
	);
	const action = (formData: FormData) => {
		const withRedirect = isAccontSettingPage;
		return selectTeam(formData, withRedirect);
	};

	const formRef = useRef<HTMLFormElement>(null);

	return (
		<form
			action={action}
			ref={formRef}
			key={`${currentTeam.id}-${isAccontSettingPage}`}
		>
			<Select
				name="teamId"
				defaultValue={isAccontSettingPage ? undefined : currentTeam.id}
				onValueChange={() => {
					formRef.current?.requestSubmit();
				}}
			>
				<SelectTrigger className="w-auto min-w-[100px] max-w-[360px] border-0 flex justify-between items-center data-[state=open]:border-0 data-[state=open]:ring-0 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 outline-none focus-visible:outline-none px-0.5 py-0.5 bg-transparent">
					<div className="flex items-center gap-1.5">
						{isAccontSettingPage ? (
							currentUser
						) : (
							<>
								<TeamAvatarImage
									avatarUrl={currentTeam.avatarUrl}
									teamName={currentTeam.name}
									width={24}
									height={24}
									className="w-6 h-6 shrink-0"
									alt={currentTeam.name}
								/>
								<span
									className="text-[14px] font-geist text-white-400 truncate max-w-[180px]"
									title={currentTeam.name}
								>
									{currentTeam.name}
								</span>
								{currentTeam.isPro !== undefined &&
									(currentTeam.isPro ? <ProTag /> : <FreeTag />)}
							</>
						)}
					</div>
					<div className="pl-3">
						<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 hover:bg-accent hover:opacity-100 hover:rounded-md hover:p-0.5" />
					</div>
				</SelectTrigger>
				<SelectContent className="p-2 border-[0.5px] border-white/10 rounded-xl shadow-[0_2px_8px_rgba(5,10,20,0.4),0_1px_2px_rgba(0,0,0,0.3)] bg-black-900/50 backdrop-blur-md">
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
										width={24}
										height={24}
										className="w-6 h-6 shrink-0"
										alt={team.name}
									/>
									<span
										className="truncate max-w-[140px] text-[14px] font-geist text-white-400 flex-1"
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

					<div className="p-2.5 flex items-center gap-x-2 rounded-lg w-full hover:bg-white/5">
						<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
							<Plus className="size-3 text-black-900" />
						</span>
						<span className="text-white-400 font-medium text-[14px] leading-[14px] font-geist">
							{teamCreation}
						</span>
					</div>
				</SelectContent>
			</Select>
		</form>
	);
}
