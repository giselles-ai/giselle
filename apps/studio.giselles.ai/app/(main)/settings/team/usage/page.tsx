import { Skeleton } from "@/components/ui/skeleton";
import { settingsV2Flag } from "@/flags";
import { Suspense } from "react";
import { AgentTimeCharge } from "../agent-time-charge";
import { AgentUsage } from "../agent-usage";

export default async function TeamUsagePage() {
	const settingsV2Mode = await settingsV2Flag();

	return (
		<div className="flex flex-col gap-[24px]">
			<h3
				className="text-primary-100 font-semibold text-[28px] leading-[33.6px] tracking-[-0.011em] font-hubotSans"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				Usage {settingsV2Mode ? "V2" : ""}
			</h3>
			<div className="flex flex-col gap-y-[16px]">
				<Suspense
					fallback={
						<div className="w-full h-24">
							<Skeleton className="h-full w-full" />
						</div>
					}
				>
					<AgentTimeCharge />
				</Suspense>

				<AgentUsage />
			</div>
		</div>
	);
}
