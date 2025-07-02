import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCurrentTeam, isProPlan } from "@/services/teams";
import { AgentTimeCharge } from "../agent-time-charge";
import { AgentUsage } from "../agent-usage";

export default async function TeamUsagePage() {
	const currentTeam = await fetchCurrentTeam();
	const currentTeamIsFreePlan = !isProPlan(currentTeam);

	return (
		<div className="flex flex-col gap-[24px]">
			<div className="flex justify-between items-center">
				<h1
					className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
					style={{
						textShadow: "0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
					}}
				>
					Usage
				</h1>
			</div>
			<div className="flex flex-col gap-y-[16px]">
				{currentTeamIsFreePlan && (
					<Suspense
						fallback={
							<div className="w-full h-24">
								<Skeleton className="h-full w-full" />
							</div>
						}
					>
						<AgentTimeCharge />
					</Suspense>
				)}

				<AgentUsage />
			</div>
		</div>
	);
}
