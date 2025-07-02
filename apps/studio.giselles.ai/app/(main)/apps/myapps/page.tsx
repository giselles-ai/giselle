import { Toasts } from "@giselles-ai/components/toasts";
import { ToastProvider } from "@giselles-ai/contexts/toast";
import { formatTimestamp } from "@giselles-ai/lib/utils";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { agents, db } from "@/drizzle";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import { DeleteAgentButton } from "../components/delete-agent-button";
import { DuplicateAgentButton } from "../components/duplicate-agent-button";

function DataList({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="text-black-30">
			<p className="text-[12px]">{label}</p>
			<div className="font-bold">{children}</div>
		</div>
	);
}

async function MyAgentList() {
	const [currentTeam, currentUser] = await Promise.all([
		fetchCurrentTeam(),
		fetchCurrentUser(),
	]);

	const dbAgents = await db
		.select({
			id: agents.id,
			name: agents.name,
			updatedAt: agents.updatedAt,
			workspaceId: agents.workspaceId,
		})
		.from(agents)
		.where(
			and(
				eq(agents.teamDbId, currentTeam.dbId),
				isNotNull(agents.workspaceId),
				eq(agents.creatorDbId, currentUser.dbId), // Filter by current user as creator
			),
		)
		.orderBy(desc(agents.updatedAt));

	if (dbAgents.length === 0) {
		return (
			<div className="flex justify-center items-center h-full">
				<div className="grid gap-[8px] justify-center text-center">
					<h3 className="text-[18px] font-geist font-bold text-black-400">
						No apps created by you yet.
					</h3>
					<p className="text-[12px] font-geist text-black-400">
						Please create a new app with the 'Create new' button in the left
						sidebar.
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="flex flex-wrap gap-4">
				{dbAgents.map((agent) => (
					<div
						key={agent.id}
						className="relative group flex-grow basis-[280px] min-w-[280px] max-w-[376px] h-[354px]"
					>
						{/* Menu buttons - positioned absolutely on top of the card */}
						<div className="absolute top-0 right-[8px] z-10 opacity-60 group-hover:opacity-100 transition-opacity flex">
							<DuplicateAgentButton
								agentId={agent.id}
								agentName={agent.name || "Untitled"}
							/>
							<DeleteAgentButton
								agentId={agent.id}
								agentName={agent.name || "Untitled"}
							/>
						</div>

						<Link href={`/workspaces/${agent.workspaceId}`}>
							<div className="bg-white-850/10 p-[16px] relative rounded-[8px] transition-all duration-300 hover:shadow-lg h-full flex flex-col">
								{/* Upper padding area (for menu buttons) */}
								<div className="h-[20px] mb-1.5" />

								{/* Thumbnail */}
								<div className="h-[150px] bg-black-80 rounded-[8px] mb-4" />

								<div className="flex-grow">
									<h3 className="font-sans text-white-400 text-[16px] font-semibold mb-1 line-clamp-2">
										{agent.name || "Untitled"}
									</h3>
								</div>

								<div className="mt-auto">
									<div className="border-t-[0.5px] border-black-400 my-4" />
									<div className="flex justify-between items-center">
										<span className="text-white-400 text-xs font-geist truncate max-w-[200px]">
											Edited by you -{" "}
											{formatTimestamp.toRelativeTime(
												new Date(agent.updatedAt).getTime(),
											)}
										</span>
									</div>
								</div>

								<div className="absolute z-0 inset-0 border-[0.5px] rounded-[8px] mask-fill bg-gradient-to-br from-[#7182AA80] to-[#02075066] bg-origin-border bg-clip-boarder border-transparent transition-all duration-300" />
								<div className="absolute z-1 inset-0 border-[0.5px] border-white-900 rounded-[8px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
							</div>
						</Link>
					</div>
				))}
			</div>
		</>
	);
}

export default function MyAppsPage() {
	return (
		<ToastProvider>
			<div className="w-full">
				<h1 className="text-[28px] font-sans font-medium mb-8 text-primary-100 drop-shadow-[0_0_20px_#0087f6]">
					My Apps
				</h1>
				<Suspense
					fallback={<p className="text-center py-8 font-sans">Loading...</p>}
				>
					<MyAgentList />
				</Suspense>
				<Toasts />
			</div>
		</ToastProvider>
	);
}
