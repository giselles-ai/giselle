import { ToastProvider } from "@/packages/contexts/toast";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchUserTeams } from "@/services/teams";
import TeamCreation from "@/services/teams/components/team-creation";
import { isProPlan } from "@/services/teams/utils";
import { Plus } from "lucide-react";
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
									<button
										type="button"
										className="group relative overflow-hidden rounded-lg px-4 py-2 text-white transition-all duration-300 hover:scale-[1.01] active:scale-95"
										style={{
											boxShadow:
												"0 8px 20px rgba(107, 143, 240, 0.2), 0 3px 10px rgba(107, 143, 240, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.08)",
										}}
									>
										{/* Outer glow */}
										<div
											className="absolute inset-0 -z-10 rounded-lg blur-[2px]"
											style={{ backgroundColor: "#6B8FF0", opacity: 0.08 }}
										/>

										{/* Main glass background */}
										<div
											className="absolute inset-0 rounded-lg backdrop-blur-md"
											style={{
												background:
													"linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(107,143,240,0.1) 50%, rgba(107,143,240,0.2) 100%)",
											}}
										/>

										{/* Top reflection */}
										<div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

										{/* Subtle border */}
										<div className="absolute inset-0 rounded-lg border border-white/20" />

										{/* Content */}
										<span className="relative z-10 flex items-center gap-2">
											<span className="grid size-4 place-items-center rounded-full bg-primary-200 opacity-50">
												<Plus className="size-3 text-black-900" />
											</span>
											<span className="text-[14px] font-medium leading-[20px]">
												Create New Team
											</span>
										</span>

										{/* Hover overlay */}
										<div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
									</button>
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
