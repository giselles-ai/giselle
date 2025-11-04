"use client";

import { MoreHorizontal, Search } from "lucide-react";
import { useActionState, useCallback, useState } from "react";
import { FreeTag } from "@/components/free-tag";
import { ProTag } from "@/components/pro-tag";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { teams as teamsTable } from "@/db";
import { cn } from "@/lib/utils";
import { Toast } from "@/packages/components/toast";
import { useToast } from "@/packages/contexts/toast";
import { TeamAvatarImage } from "@/services/teams/components/team-avatar-image";
import { leaveTeam, navigateWithChangeTeam } from "./actions";

const roles = {
	admin: "Admin",
	member: "Member",
};

export default function UserTeams({
	teams,
	currentUser,
}: {
	teams: {
		id: string;
		name: string;
		role: "admin" | "member";
		avatarUrl?: typeof teamsTable.$inferSelect.avatarUrl;
		isPro?: boolean;
	}[];
	currentUser: {
		id: string;
	};
}) {
	const [teamName, setTeamName] = useState("");
	const { toasts } = useToast();

	const handleChangeTeamName = (e: React.ChangeEvent<HTMLInputElement>) => {
		setTeamName(e.target.value);
	};

	const filteredTeams = teams.filter((team) =>
		team.name.toLowerCase().includes(teamName.toLowerCase()),
	);

	return (
		<>
			<div className="relative overflow-hidden rounded-[12px] backdrop-blur-md bg-white/[0.02] border-[0.5px] border-border shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(255,255,255,0.2)] before:content-[''] before:absolute before:inset-0 before:bg-white before:opacity-[0.02] before:rounded-[inherit] before:pointer-events-none py-2">
				<div
					className="flex items-center gap-x-[11px] mt-4 mb-2 mx-4 py-2 px-3 rounded-[8px]"
					style={{
						background: "#00020A",
						boxShadow: "inset 0 1px 4px rgba(0,0,0,0.5)",
						border: "0.5px solid rgba(255,255,255,0.05)",
					}}
				>
					<Search className="size-6 text-text-muted" />
					<input
						onChange={handleChangeTeamName}
						type="text"
						value={teamName}
						placeholder="Search for a team..."
						className="w-full text-inverse font-medium text-[14px] leading-[23.8px] font-geist placeholder:text-link-muted bg-transparent outline-none"
					/>
				</div>
				<div>
					{filteredTeams.map((team, idx) => (
						<UserTeamsItem
							className={cn(
								"border-t border-border mx-4",
								idx === 0 && "border-t-0",
							)}
							key={team.id}
							teamId={team.id}
							teamName={team.name}
							avatarUrl={team.avatarUrl}
							role={roles[team.role]}
							isPro={team.isPro}
							currentUserId={currentUser.id}
						/>
					))}
				</div>
			</div>
			{toasts.map((toast) => (
				<Toast
					key={toast.id}
					title={toast.title}
					message={toast.message}
					type={toast.type}
				/>
			))}
		</>
	);
}

function UserTeamsItem({
	teamId,
	teamName,
	avatarUrl,
	role,
	isPro = false,
	currentUserId,
	className,
}: {
	teamId: string;
	teamName: string;
	avatarUrl?: typeof teamsTable.$inferSelect.avatarUrl;
	role: string;
	isPro?: boolean;
	currentUserId: string;
	className?: string;
}) {
	const { addToast } = useToast();

	const handleLeaveTeam = useCallback(async () => {
		const result = await leaveTeam(teamId, currentUserId, role);
		if (!result.success) {
			addToast({
				title: "Error",
				message: result.error,
				type: "error",
			});
		}
	}, [addToast, currentUserId, role, teamId]);
	return (
		<div
			className={cn("flex items-center justify-between gap-4 p-4", className)}
		>
			<div className="flex items-center gap-3">
				<TeamAvatarImage
					avatarUrl={avatarUrl}
					teamName={teamName}
					width={32}
					height={32}
				/>
				<div className="flex flex-col">
					<div className="flex items-center gap-2">
						<div className="text-inverse font-medium text-[16px] leading-[22.4px] font-geist">
							{teamName}
						</div>
						{isPro ? <ProTag /> : <FreeTag />}
					</div>
					<div className="text-text-muted font-medium text-[12px] leading-[20.4px] font-geist">
						{role}
					</div>
				</div>
			</div>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex items-center justify-center p-2 rounded-[4px] hover:bg-white/5 focus:outline-none"
						aria-label="Team menu"
					>
						<MoreHorizontal className="size-5 text-text/60" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="p-1 border-[0.25px] border-border rounded-[8px] min-w-[165px] bg-surface shadow-none"
				>
					<DropdownMenuItem className="p-0">
						<ChangeTeamAndAction
							teamId={teamId}
							userId={currentUserId}
							role={role}
							renderButton={(isPending) => (
								<button
									type="submit"
									className="flex items-center w-full px-3 py-2 text-left text-[14px] leading-[16px] hover:bg-white/5 text-inverse rounded-md"
									disabled={isPending}
								>
									Apps
								</button>
							)}
							action={() => navigateWithChangeTeam(teamId, "/apps")}
						/>
					</DropdownMenuItem>
					<DropdownMenuItem className="p-0">
						<ChangeTeamAndAction
							teamId={teamId}
							userId={currentUserId}
							role={role}
							renderButton={(isPending) => (
								<button
									type="submit"
									className="flex items-center w-full px-3 py-2 text-left text-[14px] leading-[16px] hover:bg-white/5 text-inverse rounded-md"
									disabled={isPending}
								>
									Settings
								</button>
							)}
							action={() => navigateWithChangeTeam(teamId, "/settings/team")}
						/>
					</DropdownMenuItem>
					<div className="my-2 h-px bg-white/10" />
					<DropdownMenuItem className="p-0">
						<ChangeTeamAndAction
							teamId={teamId}
							userId={currentUserId}
							role={role}
							renderButton={(isPending) => (
								<button
									type="submit"
									className="flex items-center w-full px-3 py-2 font-medium text-[14px] leading-[16px] text-error-900 hover:bg-error-900/20 rounded-md"
									disabled={isPending}
								>
									Leave team
								</button>
							)}
							action={handleLeaveTeam}
						/>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

interface ChangeTeamAndActionProps {
	teamId: string;
	userId: string;
	role: string;
	renderButton: (isPending: boolean) => React.ReactNode;
	action: () => Promise<void>;
}
function ChangeTeamAndAction({
	renderButton,
	action,
}: ChangeTeamAndActionProps) {
	const [_state, formAction, isPending] = useActionState(action, null);

	return (
		<form className="w-full" action={formAction}>
			{renderButton(isPending)}
		</form>
	);
}
