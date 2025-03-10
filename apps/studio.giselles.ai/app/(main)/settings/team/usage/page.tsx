import { Skeleton } from "@/components/ui/skeleton";
import { settingsV2Flag } from "@/flags";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AgentTimeCharge } from "../v2/agent-time-charge";
import { AgentUsage } from "../v2/agent-usage";

export default async function TeamUsagePage() {
	const settingsV2Mode = await settingsV2Flag();
	if (!settingsV2Mode) {
		return notFound();
	}
	return (
		<div className="flex flex-col gap-[24px]">
			<h3
				className="text-primary-100 font-semibold text-[28px] leading-[33.6px] tracking-[-0.011em] font-hubot"
				style={{ textShadow: "0px 0px 20px hsla(207, 100%, 48%, 1)" }}
			>
				Usage
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
