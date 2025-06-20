import { agents, db } from "@/drizzle";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import { createId } from "@paralleldrive/cuid2";
import { ExternalLink } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { giselleEngine } from "../../giselle-engine";

export default function Layout({
	children,
}: {
	children: ReactNode;
}) {
	async function createAgent() {
		"use server";
		const agentId = `agnt_${createId()}` as const;
		const user = await fetchCurrentUser();
		const team = await fetchCurrentTeam();
		const workspace = await giselleEngine.createWorkspace();

		await db.insert(agents).values({
			id: agentId,
			teamDbId: team.dbId,
			creatorDbId: user.dbId,
			workspaceId: workspace.id,
		});
		redirect(`/workspaces/${workspace.id}`);
	}

	return (
		<div className="h-full bg-black-900">
			<div className="px-[40px] py-[24px] flex-1 max-w-[1200px] mx-auto w-full">
				<div className="flex justify-between items-center mb-8">
					<h1
						className="text-[30px] font-sans font-medium text-[hsl(192,73%,84%)]"
						style={{
							textShadow:
								"0 0 20px #0087f6, 0 0 40px #0087f6, 0 0 60px #0087f6",
						}}
					>
						Apps
					</h1>
					<div className="flex items-center gap-4">
						<a
							href="https://docs.giselles.ai/guides/apps/teamapp"
							target="_blank"
							rel="noopener noreferrer"
							className="text-black-300 text-[14px] font-medium rounded-[4px] px-1.5 py-0.5 hover:bg-black-300/10 flex items-center gap-1.5 font-sans"
						>
							About Apps
							<ExternalLink size={14} />
						</a>
						<form action={createAgent}>
							<button
								type="submit"
								className="bg-primary-200 hover:bg-primary-100 text-black-900 font-bold py-2 px-4 rounded-md font-sans cursor-pointer border border-primary-200"
							>
								New App +
							</button>
						</form>
					</div>
				</div>
				{children}
			</div>
		</div>
	);
}
