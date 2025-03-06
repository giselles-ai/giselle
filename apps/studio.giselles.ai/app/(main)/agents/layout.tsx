import { Button } from "@/components/ui/button";
import { agents, db } from "@/drizzle";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import { putGraph } from "@giselles-ai/actions";
import { initGraph } from "@giselles-ai/lib/utils";
import { createId } from "@paralleldrive/cuid2";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CreateAgentButton } from "./components";

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
		await db.insert(agents).values({
			id: agentId,
			teamDbId: team.dbId,
			creatorDbId: user.dbId,
			graphUrl: url,
		});
		redirect(`/p/${agentId}`);
	}

	return (
		<div className="flex h-full divide-x divide-black-80">
			<div className="w-[200px] h-full p-[24px]">
				<form action={createAgent}>
					<CreateAgentButton />
				</form>
			</div>
			<div className="p-[24px] flex-1">{children}</div>
		</div>
	);
}
