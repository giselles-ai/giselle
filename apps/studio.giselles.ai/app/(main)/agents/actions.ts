"use server";

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
import { putGraph } from "@giselles-ai/actions";
import {
	buildFileFolderPath,
	createFileId,
	createGraphId,
	pathJoin,
	pathnameToFilename,
} from "@giselles-ai/lib/utils";
import type { AgentId, Graph, Node } from "@giselles-ai/types";
import { createId } from "@paralleldrive/cuid2";
import { copy, del, list } from "@vercel/blob";
import { eq } from "drizzle-orm";

interface AgentDuplicationSuccess {
	result: "success";
	agentId: AgentId;
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
	if (agent === undefined || agent.graphUrl === null) {
		return { result: "error", message: `${agentId} is not found.` };
	}

	try {
		const startTime = Date.now();
		const logger = createLogger("copyAgent");

		const [user, team, graph] = await Promise.all([
			fetchCurrentUser(),
			fetchCurrentTeam(),
			fetch(agent.graphUrl).then((res) => res.json() as unknown as Graph),
		]);
		if (agent.teamDbId !== team.dbId) {
			return {
				result: "error",
				message: "You are not allowed to duplicate this agent",
			};
		}

		const newNodes = await Promise.all(
			graph.nodes.map(async (node) => {
				if (node.content.type !== "files") {
					return node;
				}
				const newData = await Promise.all(
					node.content.data.map(async (fileData) => {
						if (fileData.status !== "completed") {
							return null;
						}
						const newFileId = createFileId();
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

						let newFileBlobUrl = "";
						let newTextDataUrl = "";

						await Promise.all(
							blobList.blobs.map(async (blob) => {
								const { url: copyUrl } = await withCountMeasurement(
									logger,
									async () => {
										const copyResult = await copy(
											blob.url,
											pathJoin(
												buildFileFolderPath(newFileId),
												pathnameToFilename(blob.pathname),
											),
											{
												addRandomSuffix: true,
												access: "public",
											},
										);
										return {
											url: copyResult.url,
											size: blob.size,
										};
									},
									ExternalServiceName.VercelBlob,
									startTime,
									VercelBlobOperation.Copy,
								);

								if (blob.url === fileData.fileBlobUrl) {
									newFileBlobUrl = copyUrl;
								}
								if (blob.url === fileData.textDataUrl) {
									newTextDataUrl = copyUrl;
								}
							}),
						);

						return {
							...fileData,
							id: newFileId,
							fileBlobUrl: newFileBlobUrl,
							textDataUrl: newTextDataUrl,
						};
					}),
				).then((data) => data.filter((d) => d !== null));
				return {
					...node,
					content: {
						...node.content,
						data: newData,
					},
				} as Node;
			}),
		);

		const newGraphId = createGraphId();
		const { url } = await putGraph({
			...graph,
			id: newGraphId,
			nodes: newNodes,
		});

		const newAgentId = `agnt_${createId()}` as AgentId;
		const insertResult = await db
			.insert(agents)
			.values({
				id: newAgentId,
				name: `Copy of ${agent.name ?? agentId}`,
				teamDbId: team.dbId,
				creatorDbId: user.dbId,
				graphUrl: url,
				graphv2: {
					agentId: newAgentId,
					nodes: [],
					xyFlow: {
						nodes: [],
						edges: [],
					},
					connectors: [],
					artifacts: [],
					webSearches: [],
					mode: "edit",
					flowIndexes: [],
				},
			})
			.returning({ id: agents.id });

		if (insertResult.length === 0) {
			return {
				result: "error",
				message: "Failed to save the duplicated agent",
			};
		}

		waitForTelemetryExport();
		const newAgent = insertResult[0];
		return { result: "success", agentId: newAgent.id };
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
			message: "You are not allowed to delete this agent",
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
