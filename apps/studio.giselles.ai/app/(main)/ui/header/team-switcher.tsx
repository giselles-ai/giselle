import { PopoverContent } from "@giselle-internal/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Popover } from "radix-ui";
import { use } from "react";
import { FreeTag } from "@/components/free-tag";
import { ProTag } from "@/components/pro-tag";
import { getCurrentUser } from "@/lib/get-current-user";
import {
	fetchCurrentTeam,
	fetchUserTeams,
	isProPlan,
	setCurrentTeam,
} from "@/services/teams";
import { canCreateFreeTeam } from "@/services/teams/plan-features/free-team-creation";
import {
	CreateTeamDialog,
	CreateTeamDialogTrigger,
} from "./create-team-dialog";
import { TeamAvatarImage } from "./team-avatar-image";
import { TeamSwitchButton } from "./team-switch-button";

export async function getTeamContext() {
	const [currentUser, currentTeam, memberTeams] = await Promise.all([
		getCurrentUser(),
		fetchCurrentTeam(),
		fetchUserTeams(),
	]);

	const isFreeTeamCreationAllowed = canCreateFreeTeam(
		currentUser.email,
		memberTeams.map((team) => team.plan),
	);
	return {
		currentTeam,
		memberTeams,
		isFreeTeamCreationAllowed,
	};
}

type TeamContext = Awaited<ReturnType<typeof getTeamContext>>;

export function TeamSwitcher({
	getTeamContext,
}: {
	getTeamContext: Promise<TeamContext>;
}) {
	const { currentTeam, memberTeams, isFreeTeamCreationAllowed } =
		use(getTeamContext);
	const currentTeamIsPro = isProPlan(currentTeam);
	async function changeTeamAction(nextTeamId: string) {
		"use server";

		await setCurrentTeam(nextTeamId);
		revalidatePath("/workspaces");
		redirect("/workspaces");
	}

	return (
		<>
			<Popover.Root>
				<Popover.Trigger className="w-full border-0 flex justify-between items-center data-[state=open]:border-0 data-[state=open]:ring-0 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 outline-none pt-[2px] pr-[8px] pb-[2px] pl-[12px] bg-transparent">
					<div className="flex items-center gap-[6px] flex-1 min-w-0">
						<TeamAvatarImage
							avatarUrl={currentTeam.avatarUrl}
							teamName={currentTeam.name}
							width={16}
							height={16}
							className="shrink-0"
							alt={currentTeam.name}
						/>
						<span className="text-inverse text-[14px] font-medium overflow-hidden text-ellipsis whitespace-nowrap">
							{currentTeam.name}
						</span>
						{currentTeamIsPro ? <ProTag /> : <FreeTag />}
					</div>
					<div className="pl-3 ml-auto flex-none">
						<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 hover:bg-white/10 hover:opacity-100 hover:rounded-md hover:p-0.5" />
					</div>
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Content sideOffset={4} align="start">
						<PopoverContent>
							{memberTeams.map((team) => (
								<TeamSwitchButton
									key={team.id}
									id={team.id}
									name={team.name}
									avatarUrl={team.avatarUrl}
									isPro={isProPlan(team)}
									isCurrentTeam={team.id === currentTeam.id}
									changeTeamAction={changeTeamAction}
								/>
							))}
							<div className="bg-white/10 h-px mx-1 my-1" />

							<CreateTeamDialogTrigger />
						</PopoverContent>
					</Popover.Content>
				</Popover.Portal>
			</Popover.Root>
			<CreateTeamDialog
				proPlanPrice="$20"
				isFreeTeamCreationAllowed={isFreeTeamCreationAllowed}
			/>
		</>
	);
}
