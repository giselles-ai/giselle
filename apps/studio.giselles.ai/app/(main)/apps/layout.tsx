import { agents, db } from "@/drizzle";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import { putGraph } from "@giselles-ai/actions";
import { WilliIcon } from "@giselles-ai/icons/willi";
import { initGraph } from "@giselles-ai/lib/utils";
import { createId } from "@paralleldrive/cuid2";
import { BookIcon, Clock } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { giselleEngine } from "../../giselle-engine";
import { NavigationItem } from "./components/navigation-item";

export default function Layout({
	children,
}: {
	children: ReactNode;
}) {
	async function createAgent() {
		"use server";
		const graph = initGraph();
		const agentId = `agnt_${createId()}` as const;
		const { url } = await putGraph(graph);
		const user = await fetchCurrentUser();
		const team = await fetchCurrentTeam();
		const workspace = await giselleEngine.createWorkspace();
		await db.insert(agents).values({
			id: agentId,
			teamDbId: team.dbId,
			creatorDbId: user.dbId,
			graphUrl: url,
			workspaceId: workspace.id,
		});
		redirect(`/workspaces/${workspace.id}`);
	}
	async function createSampleAgent() {
		"use server";
		const graph = initGraph();
		const agentId = `agnt_${createId()}` as const;
		const { url } = await putGraph(graph);
		const user = await fetchCurrentUser();
		const team = await fetchCurrentTeam();
		const workspace = await giselleEngine.createSampleWorkspace();
		await db.insert(agents).values({
			id: agentId,
			teamDbId: team.dbId,
			creatorDbId: user.dbId,
			graphUrl: url,
			workspaceId: workspace.id,
		});
		redirect(`/workspaces/${workspace.id}`);
	}

	return (
		<div className="flex h-full divide-x divide-black-80">
			{/* Left Menu */}
			<div className="w-[240px] h-full bg-black-900 p-[24px] flex flex-col">
				{/* New App + Button */}
				<div className="mb-8 flex flex-col gap-[8px]">
					<form action={createAgent}>
						<button
							type="submit"
							className="w-full bg-primary-200 hover:bg-primary-100 text-black-900 font-bold py-2 px-4 rounded-md font-hubot cursor-pointer border border-primary-200"
						>
							New App +
						</button>
					</form>

					{/* <form action={createSampleAgent}>
						<button
							type="submit"
							className="w-full text-white-800 py-2 px-4 rounded-md font-hubot cursor-pointer border border-primary-300"
						>
							Start with sample
						</button>
					</form> */}
				</div>

				{/* Menu Items */}
				<div className="flex flex-col space-y-5">
					{/* Recent menu item */}
					<NavigationItem
						href="/apps"
						icon={<Clock className="w-5 h-5" />}
						label="Recent"
					/>

					{/* My Apps menu item */}
					<NavigationItem
						href="/apps/myapps"
						icon={<WilliIcon className="w-5 h-5 fill-current" />}
						label="My Apps"
					/>

					<NavigationItem
						href="https://docs.giselles.ai/"
						icon={<BookIcon className="w-5 h-5" />}
						label="Guide"
						openInNewTab={true}
					/>
				</div>
			</div>

			{/* Main Content */}
			<div className="p-[24px] flex-1 bg-black-900">{children}</div>
		</div>
	);
}
