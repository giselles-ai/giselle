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
		isPro: isProPlan(team),
	}));

	const currentUser = await fetchCurrentUser();

	return (
		<ToastProvider>
			<div className="flex flex-col gap-[12px]">
				<h1
					className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
					style={{
						textShadow: "0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
					}}
				>
					Overview
				</h1>
				<div className="flex flex-col gap-y-[12px]">
					<div className="space-y-2 p-6 gap-y-[12px]">
						<div className="flex justify-between items-center">
							<div>
								<h4 className="text-white-400 text-[18px] font-medium font-sans">
									Teams
								</h4>
								<p className="text-black-400 text-[12px] font-geist">
									The teams that are associated with your Giselle account.
								</p>
							</div>
							<div className="grid placeitems-center">
								<TeamCreation>
									<GlassButton type="button">
										<span className="grid size-4 place-items-center rounded-full bg-primary-200 opacity-50">
											<Plus className="size-3 text-black-900" />
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
