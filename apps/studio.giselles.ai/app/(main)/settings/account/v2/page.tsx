import { Button } from "@/components/v2/ui/button";
import { ToastProvider } from "@/packages/contexts/toast";
import { fetchUserTeams } from "@/services/teams";
import TeamCreation from "@/services/teams/components/v2/team-creation";
import { Card } from "../../components/v2/card";
import { AccountToasts } from "../account-toasts";
import UserTeams from "./user-teams";

export default async function AccountSettingPageV2() {
	const teams = await fetchUserTeams();

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
						<UserTeams teams={teams} />
					</Card>
				</div>
			</div>
			<AccountToasts />
		</ToastProvider>
	);
}
