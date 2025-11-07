import { DocsLink } from "@giselle-internal/ui/docs-link";
import { Plus } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { ToastProvider } from "@/packages/contexts/toast";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchUserTeams } from "@/services/teams";
import TeamCreation from "@/services/teams/components/team-creation";
import { isProPlan } from "@/services/teams/utils";
import UserTeams from "./user-teams";

export default async function AccountSettingPage() {
	const teams = await fetchUserTeams();

	// Add isPro information to each team
	const teamsWithProInfo = teams.map((team) => ({
		id: team.id,
		name: team.name,
		role: team.role,
		avatarUrl: team.avatarUrl,
		isPro: isProPlan(team),
	}));

	const currentUser = await fetchCurrentUser();

	return (
		<ToastProvider>
			<div className="flex flex-col gap-[12px]">
				<div className="flex items-center justify-end">
					<DocsLink
						href="https://docs.giselles.ai/en/guides/settings/account/overview"
						target="_blank"
						rel="noopener noreferrer"
					>
						About Account Overview
					</DocsLink>
				</div>
				<div className="flex flex-col gap-y-[12px]">
					<div className="space-y-2 gap-y-[12px]">
						<div className="flex justify-between items-center">
							<div>
								<h4 className="text-text text-[18px] font-medium font-sans">
									Teams
								</h4>
								<p className="text-link-muted text-[12px] font-geist">
									The teams that are associated with your Giselle account.
								</p>
							</div>
							<div className="grid placeitems-center">
								<TeamCreation>
									<GlassButton type="button">
										<span className="grid size-4 place-items-center rounded-full bg-primary-200 opacity-50">
											<Plus className="size-3 text-background" />
										</span>
										<span className="text-[14px] font-medium leading-[20px]">
											Create New Team
										</span>
									</GlassButton>
								</TeamCreation>
							</div>
						</div>
						<UserTeams
							teams={teamsWithProInfo}
							currentUser={{ id: currentUser.id }}
						/>
					</div>
				</div>
			</div>
		</ToastProvider>
	);
}
