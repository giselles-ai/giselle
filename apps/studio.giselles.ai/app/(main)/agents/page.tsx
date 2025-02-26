import { agents, db } from "@/drizzle";
import { fetchCurrentTeam } from "@/services/teams";
import { ToastProvider } from "@giselles-ai/contexts/toast";
import { formatTimestamp } from "@giselles-ai/lib/utils";
import { and, eq, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { DeleteAgentButton, DuplicateAgentButton, Toasts } from "./components";

function DataList({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className=" text-black-30">
			<p className="text-[12px]">{label}</p>
			<div className="font-bold">{children}</div>
		</div>
	);
}

async function AgentList() {
	const currentTeam = await fetchCurrentTeam();
	const dbAgents = await db
		.select({ id: agents.id, name: agents.name, updatedAt: agents.updatedAt })
		.from(agents)
		.where(
			and(eq(agents.teamDbId, currentTeam.dbId), isNotNull(agents.graphUrl)),
		);
	if (dbAgents.length === 0) {
		return (
			<div className="flex justify-center items-center h-full">
				<div className="grid gap-[12px] justify-center text-center">
					<div>No agents found</div>
				</div>
			</div>
		);
	}
	return (
		<>
			<div className="grid gap-[16px] grid-cols-3">
				{dbAgents.map((agent) => (
					<div key={agent.id} className="relative">
						<Link href={`/p/${agent.id}`}>
							<div className="bg-linear-to-br from-[hsla(187,79%,54%,0.2)] to-[hsla(207,100%,9%,0.2)] p-[18px] relative rounded-[8px]">
								<div className="divide-y divide-black-70">
									<div className="h-[60px]">
										<p className="font-rosart text-black-30 text-[18px]">
											{agent.name ?? "Unname Agent"}
										</p>
									</div>
									<div className="pt-[8px] grid grid-col-3">
										<DataList label="Last updated">
											{formatTimestamp.toRelativeTime(
												new Date(agent.updatedAt).getTime(),
											)}
										</DataList>
									</div>
								</div>
								<div className="absolute z-0 inset-0 border rounded-[8px] mask-fill bg-linear-to-br bg-origin-border bg-clip-boarder border-transparent from-[hsla(192,73%,84%,0.5)] to-[hsla(192,60%,33%,0.4)]" />
							</div>
						</Link>
						<DuplicateAgentButton agentId={agent.id} agentName={agent.name} />
						<DeleteAgentButton agentId={agent.id} agentName={agent.name} />
					</div>
				))}
			</div>
		</>
	);
}

export default function AgentListV2Page() {
	return (
		<ToastProvider>
			<Suspense fallback={<p>loading...</p>}>
				<AgentList />
			</Suspense>
			<Toasts />
		</ToastProvider>
	);
}
