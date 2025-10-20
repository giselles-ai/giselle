import { DocsLink } from "@giselle-internal/ui/docs-link";
import { PageHeading } from "@giselle-internal/ui/page-heading";
import { createId } from "@paralleldrive/cuid2";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { agents, db, workspaces } from "@/drizzle";
import { experimental_storageFlag } from "@/flags";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import { giselleEngine } from "../../giselle-engine";

export default function Layout({ children }: { children: ReactNode }) {
	async function createAgent() {
		"use server";
		const agentId = `agnt_${createId()}` as const;
		const user = await fetchCurrentUser();
		const team = await fetchCurrentTeam();
		const experimental_storage = await experimental_storageFlag();
		const workspace = await giselleEngine.createWorkspace({
			useExperimentalStorage: experimental_storage,
		});

		// The agents table is deprecated, so we are inserting into the workspaces table.
		await db.insert(agents).values({
			id: agentId,
			teamDbId: team.dbId,
			creatorDbId: user.dbId,
			workspaceId: workspace.id,
		});
		await db.insert(workspaces).values({
			id: workspace.id,
			creatorDbId: user.dbId,
			teamDbId: team.dbId,
		});

		redirect(`/workspaces/${workspace.id}`);
	}

	return (
		<div className="h-full bg-bg">
			<div className="px-[40px] py-[24px] flex-1 max-w-[1200px] mx-auto w-full">
				<div className="flex justify-between items-center mb-8">
					<PageHeading glow>Workspaces</PageHeading>
					<div className="flex items-center gap-4">
						<DocsLink
							href="https://docs.giselles.ai/en/guides/apps/teamapp"
							target="_blank"
							rel="noopener noreferrer"
						/>
						<form action={createAgent}>
							<GlassButton
								type="submit"
								aria-label="Create a workspace"
								className="whitespace-nowrap"
							>
								<span className="grid place-items-center rounded-full size-4 bg-primary-200 opacity-50">
									<Plus className="size-3 text-bg" />
								</span>
								New Workspace
							</GlassButton>
						</form>
					</div>
				</div>
				{children}
			</div>
		</div>
	);
}
