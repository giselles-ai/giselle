import { Button } from "@giselle-internal/ui/button";
import { StatusBadge } from "@giselle-internal/ui/status-badge";
import {
	Table,
	TableBody,
	TableCell,
	TableRow,
} from "@giselle-internal/ui/table";
import {
	isTriggerNode,
	type Workspace,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import { defaultName } from "@giselle-sdk/giselle";
import { RefreshCw } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { giselleEngine } from "@/app/giselle-engine";
import { acts as actsSchema, db } from "@/drizzle";
import { experimental_storageFlag, stageFlag } from "@/flags";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchUserTeams } from "@/services/teams";
import { type FlowTriggerUIItem, Form } from "./form";

// The maximum duration of server actions on this page is extended to 800 seconds through enabled fluid compute.
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 800;

async function reloadPage() {
	"use server";
	await Promise.resolve();
	revalidatePath("/stage");
}

export default async function StagePage() {
	const enableStage = await stageFlag();
	if (!enableStage) {
		return notFound();
	}
	const experimental_storage = await experimental_storageFlag();
	const teams = await fetchUserTeams();
	const teamOptions = teams.map((team) => ({
		value: team.id,
		label: team.name,
	}));
	const user = await fetchCurrentUser();
	const dbActs = await db.query.acts.findMany({
		where: (acts, { eq }) => eq(acts.directorDbId, user.dbId),
		orderBy: (acts, { desc }) => [desc(acts.createdAt)],
		limit: 10,
	});
	const acts = await Promise.all(
		dbActs.map(async (dbAct) => {
			const tmpAct = await giselleEngine.getAct({ actId: dbAct.sdkActId });
			const team = teams.find((t) => t.dbId === dbAct.teamDbId);
			const tmpWorkspace = await giselleEngine.getWorkspace(
				dbAct.sdkWorkspaceId,
				experimental_storage,
			);
			return {
				...tmpAct,
				teamName: team?.name || "Unknown Team",
				workspaceName: tmpWorkspace.name ?? "Untitled",
			};
		}),
	);
	const flowTriggers: Array<FlowTriggerUIItem> = [];
	for (const team of teams) {
		const tmpFlowTriggers = await db.query.flowTriggers.findMany({
			where: (flowTriggers, { eq }) => eq(flowTriggers.teamDbId, team.dbId),
		});
		const workspaceMap: Map<WorkspaceId, Workspace> = new Map();
		for (const tmpFlowTrigger of tmpFlowTriggers) {
			if (!workspaceMap.has(tmpFlowTrigger.sdkWorkspaceId)) {
				const tmpWorkspace = await giselleEngine.getWorkspace(
					tmpFlowTrigger.sdkWorkspaceId,
					experimental_storage,
				);
				workspaceMap.set(tmpFlowTrigger.sdkWorkspaceId, tmpWorkspace);
			}
			const workspace = workspaceMap.get(tmpFlowTrigger.sdkWorkspaceId);
			if (workspace === undefined) {
				continue;
			}
			const node = workspace.nodes.find(
				(node) =>
					isTriggerNode(node) &&
					node.content.state.status === "configured" &&
					node.content.state.flowTriggerId === tmpFlowTrigger.sdkFlowTriggerId,
			);
			if (node === undefined) {
				continue;
			}
			const flowTrigger = await giselleEngine.getTrigger({
				flowTriggerId: tmpFlowTrigger.sdkFlowTriggerId,
			});
			if (flowTrigger === undefined) {
				continue;
			}
			flowTriggers.push({
				id: tmpFlowTrigger.sdkFlowTriggerId,
				teamId: team.id,
				label: node.name ?? defaultName(node),
				workspaceName: workspace.name ?? "Untitled",
				sdkData: flowTrigger,
			});
		}
	}
	return (
		<div className="p-[24px] space-y-6">
			<div className="text-center text-[24px] font-sans text-white-100">
				What are we perform next ?
			</div>
			<Form
				teamOptions={teamOptions}
				flowTriggers={flowTriggers}
				performStageAction={async (payloads) => {
					"use server";

					const experimental_storage = await experimental_storageFlag();
					const user = await fetchCurrentUser();
					const build = await giselleEngine.buildWorkflowFromTrigger({
						triggerId: payloads.flowTrigger.id,
						useExperimentalStorage: experimental_storage,
					});
					if (build === null) {
						throw new Error("Workflow not found");
					}
					const { act } = await giselleEngine.createAct({
						workspaceId: payloads.flowTrigger.workspaceId,
						startNodeId: payloads.flowTrigger.nodeId,
						inputs: [
							{
								type: "parameters",
								items: payloads.parameterItems,
							},
						],
						generationOriginType: "stage",
					});

					const team = await db.query.teams.findFirst({
						where: (teams, { eq }) => eq(teams.id, payloads.teamId),
					});
					if (team === undefined) {
						throw new Error("Team not found");
					}
					await db.insert(actsSchema).values({
						teamDbId: team.dbId,
						directorDbId: user.dbId,
						sdkActId: act.id,
						sdkFlowTriggerId: payloads.flowTrigger.id,
						sdkWorkspaceId: payloads.flowTrigger.workspaceId,
					});
					after(() =>
						giselleEngine.startAct({
							actId: act.id,
						}),
					);
					revalidatePath("/stage");
				}}
			/>
			<div className="max-w-[900px] mx-auto space-y-2">
				<div className="flex items-center justify-between px-1">
					<h2 className="text-[16px] font-sans text-white-100">Acts</h2>
					<div className="flex items-center gap-3">
						<form action={reloadPage}>
							<Button
								type="submit"
								variant="subtle"
								leftIcon={<RefreshCw className="w-4 h-4" />}
							>
								Reload
							</Button>
						</form>
						<Button type="button" variant="subtle">
							Archive
						</Button>
					</div>
				</div>
				<Table>
					<TableBody>
						{acts.map((act) => {
							return (
								<TableRow key={act.id}>
									<TableCell>
										<div className="flex flex-col">
											<span>{act.name}</span>
											<span className="text-[12px] text-black-600">
												{new Date(act.createdAt).toLocaleString()} ·{" "}
												{act.teamName} · {act.workspaceName}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-center">
										{act.status === "inProgress" && (
											<StatusBadge status="info">Running</StatusBadge>
										)}
										{act.status === "completed" && (
											<StatusBadge status="success">Completed</StatusBadge>
										)}
										{act.status === "failed" && (
											<StatusBadge status="error">Failed</StatusBadge>
										)}
										{act.status === "cancelled" && (
											<StatusBadge status="ignored">Cancelled</StatusBadge>
										)}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end">
											<Link href={`/stage/acts/${act.id}`}>Details</Link>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
