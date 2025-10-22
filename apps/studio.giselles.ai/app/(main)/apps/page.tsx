import { Toasts } from "@giselles-ai/components/toasts";
import { ToastProvider } from "@giselles-ai/contexts/toast";
import { isNotNull } from "drizzle-orm";
import { Suspense, use } from "react";
import { db, type agents as dbAgents } from "@/drizzle";
import { fetchCurrentTeam } from "@/services/teams";
import { SearchableAgentList } from "./components/searchable-agent-list";

function AgentList({
	agents: agentsPromise,
}: {
	agents: Promise<(typeof dbAgents.$inferSelect)[]>;
}) {
	const agents = use(agentsPromise);
	if (agents.length === 0) {
		return (
			<div className="flex justify-center items-center h-full">
				<div className="grid gap-[8px] justify-center text-center">
					<h3 className="text-[18px] font-geist font-bold text-text/60">
						No workspaces yet.
					</h3>
					<p className="text-[12px] font-geist text-text/60">
						Please create a new workspace with the 'New Workspace +' button.
					</p>
				</div>
			</div>
		);
	}
	return <SearchableAgentList agents={agents} />;
}

async function agentsQuery(teamDbId: number) {
	return await db.query.agents.findMany({
		where: (agents, { and, eq }) =>
			and(eq(agents.teamDbId, teamDbId), isNotNull(agents.workspaceId)),
		orderBy: (agents, { desc }) => desc(agents.updatedAt),
	});
}

export default async function AgentListV2Page() {
	const currentTeam = await fetchCurrentTeam();
	const agents = agentsQuery(currentTeam.dbId);
	return (
		<ToastProvider>
			<div className="w-full pt-2 pb-2">
				<Suspense fallback={<p className="text-center py-8">Loading...</p>}>
					<AgentList agents={agents} />
				</Suspense>
				<Toasts />
			</div>
		</ToastProvider>
	);
}
