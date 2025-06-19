"use server";

import { giselleEngine } from "@/app/giselle-engine";
import { agents, db, githubIntegrationSettings } from "@/drizzle";
import {
	ExternalServiceName,
	VercelBlobOperation,
	createLogger,
	waitForTelemetryExport,
	withCountMeasurement,
} from "@/lib/opentelemetry";
import { fetchCurrentUser } from "@/services/accounts";
import { fetchCurrentTeam } from "@/services/teams";
import type { WorkspaceId } from "@giselle-sdk/data-type";
import { buildFileFolderPath } from "@giselles-ai/lib/utils";
import type { AgentId, Graph } from "@giselles-ai/types";
import { createId } from "@paralleldrive/cuid2";
import { del, list } from "@vercel/blob";
import { eq } from "drizzle-orm";

interface AgentDuplicationSuccess {
	result: "success";
	workspaceId: WorkspaceId;
}
interface AgentDuplicationError {
	result: "error";
	message: string;
}
type AgentDuplicationResult = AgentDuplicationSuccess | AgentDuplicationError;

type DeleteAgentResult =
	| { result: "success"; message: string }
	| { result: "error"; message: string };

export async function copyAgent(
	agentId: AgentId,
	_formData: FormData,
): Promise<AgentDuplicationResult> {
	if (typeof agentId !== "string" || agentId.length === 0) {
		return { result: "error", message: "Please fill in the agent id" };
	}

	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.id, agentId as AgentId),
	});
	if (agent === undefined) {
		return { result: "error", message: `${agentId} is not found.` };
	}

	try {
		const [user, team] = await Promise.all([
			fetchCurrentUser(),
			fetchCurrentTeam(),
		]);
		if (agent.teamDbId !== team.dbId) {
			return {
				result: "error",
				message: "You are not allowed to duplicate this app",
			};
		}

		if (agent.workspaceId === null) {
			return {
				result: "error",
				message: "Workspace not found",
			};
		}

		const newAgentId = `agnt_${createId()}` as AgentId;
		const baseName = agent.name?.trim() || agentId;
		const newName = `Copy of ${baseName}`;
		const workspace = await giselleEngine.copyWorkspace(
			agent.workspaceId,
			newName,
		);
		await db.insert(agents).values({
			id: newAgentId,
			name: newName,
			teamDbId: team.dbId,
			creatorDbId: user.dbId,
			graphUrl: agent.graphUrl, // TODO: This field is not used in the new playground and will be removed in the future
			workspaceId: workspace.id,
		});

		waitForTelemetryExport();
		return { result: "success", workspaceId: workspace.id };
	} catch (error) {
		console.error("Failed to copy agent:", error);
		return {
			result: "error",
			message: `Failed to copy agent: ${error instanceof Error ? error.message : "Unknown error"}`,
		};
	}
}

export async function deleteAgent(
	agentId: string,
	formData: FormData,
): Promise<DeleteAgentResult> {
	if (typeof agentId !== "string" || agentId.length === 0) {
		return { result: "error", message: "Invalid agent id" };
	}

	const agent = await db.query.agents.findFirst({
		where: (agents, { eq }) => eq(agents.id, agentId as AgentId),
	});

	if (agent === undefined || agent.graphUrl === null) {
		return { result: "error", message: `Agent ${agentId} not found` };
	}

	const team = await fetchCurrentTeam();
	if (agent.teamDbId !== team.dbId) {
		return {
			result: "error",
			message: "You are not allowed to delete this app",
		};
	}

	try {
		const startTime = Date.now();
		const logger = createLogger("deleteAgent");

		// Fetch graph data
		const graph = await fetch(agent.graphUrl).then(
			(res) => res.json() as unknown as Graph,
		);

		// Collect all blob URLs that need to be deleted
		const blobUrlsToDelete = new Set<string>();
		blobUrlsToDelete.add(agent.graphUrl);
		let toDeleteBlobSize = 0;
		toDeleteBlobSize += new TextEncoder().encode(JSON.stringify(graph)).length;

		// Handle file nodes and their blobs
		for (const node of graph.nodes) {
			if (node.content.type === "files") {
				for (const fileData of node.content.data) {
					if (fileData.status === "completed") {
						// Get all blobs in the file folder
						const { blobList } = await withCountMeasurement(
							logger,
							async () => {
								const result = await list({
									prefix: buildFileFolderPath(fileData.id),
								});
								const size = result.blobs.reduce(
									(sum, blob) => sum + blob.size,
									0,
								);
								return {
									blobList: result,
									size,
								};
							},
							ExternalServiceName.VercelBlob,
							startTime,
							VercelBlobOperation.List,
						);
						for (const blob of blobList.blobs) {
							blobUrlsToDelete.add(blob.url);
							toDeleteBlobSize += blob.size;
						}
					}
				}
			}
		}

		// Delete all collected blobs
		if (blobUrlsToDelete.size > 0) {
			await withCountMeasurement(
				logger,
				async () => {
					const urls = Array.from(blobUrlsToDelete);
					await del(urls);
					return {
						size: toDeleteBlobSize,
					};
				},
				ExternalServiceName.VercelBlob,
				startTime,
				VercelBlobOperation.Del,
			);
			waitForTelemetryExport();
		}

		// Delete the agent from database
		await db.transaction(async (tx) => {
			await tx
				.delete(githubIntegrationSettings)
				.where(eq(githubIntegrationSettings.agentDbId, agent.dbId));
			await tx.delete(agents).where(eq(agents.id, agentId as AgentId));
		});

		return {
			result: "success",
			message: "Agent deleted successfully",
		};
	} catch (error) {
		console.error("Failed to delete agent:", error);
		return {
			result: "error",
			message: `Failed to delete agent: ${error instanceof Error ? error.message : "Unknown error"}`,
		};
	}
}
