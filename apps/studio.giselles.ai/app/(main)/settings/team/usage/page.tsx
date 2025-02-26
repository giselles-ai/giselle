import { Skeleton } from "@/components/ui/skeleton";
import { settingsV2Flag } from "@/flags";
import { Suspense } from "react";
import { AgentTimeCharge } from "../agent-time-charge";
import { AgentUsage } from "../agent-usage";

export default async function TeamUsagePage() {
	const settingsV2Mode = await settingsV2Flag();

	return (
		<div className="grid gap-[16px]">
			<h3
				className="text-[32px] text-black--30 font-rosart"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				Usage {settingsV2Mode ? "V2" : ""}
			</h3>
			<Suspense
				fallback={
					<div className="w-full h-24">
						<Skeleton className="h-full w-full" />
					</div>
				}
			>
				<AgentTimeCharge />
			</Suspense>

			<Suspense
				fallback={
					<div className="w-full h-24">
						<Skeleton className="h-full w-full" />
					</div>
				}
			>
			</Suspense>
			<AgentUsage />
		</div>
	);
}
