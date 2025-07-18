import {
	Table,
	TableBody,
	TableCell,
	TableRow,
} from "@giselle-internal/ui/table";
import {
	isTriggerNode,
	RunId,
	type Workspace,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import { defaultName } from "@giselle-sdk/giselle-engine";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { acts as actsSchema, db } from "@/drizzle";
import { experimental_storageFlag, stageFlag } from "@/flags";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchUserTeams } from "@/services/teams";
import { giselleEngine } from "../giselle-engine";
import { type FlowTriggerUIItem, Form } from "./form";

// The maximum duration of server actions on this page is extended to 800 seconds through enabled fluid compute.
// https://vercel.com/docs/functions/runtimes#max-duration
export const maxDuration = 800;

export default async function StagePage() {
	const enableStage = await stageFlag();
	if (!enableStage) {
		return notFound();
	}
	const experimental_storage = await experimental_storageFlag();
	const teams = await fetchUserTeams();
	const teamOptions = teams.map((team) => ({ id: team.id, label: team.name }));
	const user = await fetchCurrentUser();
	const acts = await db.query.acts.findMany({
		where: (acts, { eq }) => eq(acts.directorDbId, user.dbId),
		orderBy: (acts, { desc }) => [desc(acts.createdAt)],
		limit: 10,
	});
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

					const user = await fetchCurrentUser();
					const build = await giselleEngine.buildWorkflowFromTrigger({
						triggerId: payloads.flowTrigger.id,
						useExperimentalStorage: experimental_storage,
					});
					if (build === null) {
						throw new Error("Workflow not found");
					}
					const run = await giselleEngine.createRun({
						workspaceId: payloads.flowTrigger.workspaceId,
						jobsCount: build.workflow.jobs.length,
						trigger: "studio",
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
						sdkFlowRunId: run.id,
						sdkFlowTriggerId: payloads.flowTrigger.id,
						sdkWorkspaceId: payloads.flowTrigger.workspaceId,
					});
					after(() =>
						giselleEngine.runFlow({
							flow: build.workflow,
							flowRunId: run.id,
							runId: RunId.generate(),
							workspaceId: payloads.flowTrigger.workspaceId,
							triggerInputs: [
								{
									type: "parameters",
									items: payloads.parameterItems,
								},
							],
							useExperimentalStorage: experimental_storage,
						}),
					);
				}}
			/>
			<div className="max-w-[900px] mx-auto space-y-2">
				<div className="flex items-center justify-between px-1">
					<h2 className="text-[16px] font-sans text-white-100">Acts</h2>
					<button
						type="button"
						className="text-[14px] text-black-70 hover:text-white-100"
					>
						Archive
					</button>
				</div>
				<Table>
					<TableBody>
						{acts.map((task) => {
							const team = teams.find((t) => t.dbId === task.teamDbId);
							return (
								<TableRow key={task.dbId}>
									<TableCell>
										<div className="flex flex-col">
											<span>Flow Run: {task.sdkFlowRunId}</span>
											<span className="text-[12px] text-black-600">
												{task.createdAt.toLocaleString()} ·{" "}
												{team?.name || "Unknown Team"}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-center">-</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end">
											<Link
												href={`/stage/acts/${task.sdkFlowRunId.substring(5)}`}
											>
												Details
											</Link>
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
