import { ToastProvider } from "@/packages/contexts/toast";
import { fetchUserTeams } from "@/services/teams";
import TeamCreation from "@/services/teams/components/team-creation";
import { isProPlan } from "@/services/teams/utils";
import { Button } from "../components/button";
import { Card } from "../components/card";
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

	return (
		<ToastProvider>
			<div className="flex flex-col gap-[24px]">
				<h3
					className="text-primary-100 font-semibold text-[28px] leading-[28px] tracking-[-0.011em] font-hubot"
					style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
				>
					Overview
				</h3>
				<div className="flex flex-col gap-y-[16px]">
					<Card
						title="Teams"
						description="The teams that are associated with your Giselle account."
						action={{
							component: (
								<div className="grid placeitems-center">
									<TeamCreation>
										<Button>Create New Team</Button>
									</TeamCreation>
								</div>
							),
						}}
					>
						<UserTeams teams={teamsWithProInfo} />
					</Card>
				</div>
			</div>
		</ToastProvider>
	);
}
