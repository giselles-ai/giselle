"use server";

import { agents, db } from "@/drizzle";
import {
	ExternalServiceName,
	VercelBlobOperation,
	createLogger,
	waitForTelemetryExport,
	withCountMeasurement,
} from "@/lib/opentelemetry";
import { putGraph } from "@giselles-ai/actions";
import {
	buildFileFolderPath,
	createFileId,
	createNodeId,
	pathJoin,
	pathnameToFilename,
} from "@giselles-ai/lib/utils";
import type { AgentId, Graph, Node } from "@giselles-ai/types";
import { copy, list } from "@vercel/blob";
import { eq } from "drizzle-orm";

interface FilesDuplicationSuccess {
	result: "success";
	message: string;
}
interface FilesDuplicationError {
	result: "error";
	message: string;
}
type FilesDuplicationResult = FilesDuplicationSuccess | FilesDuplicationError;

export async function copyFiles(
	agentId: AgentId,
	targetNode: Node,
): Promise<FilesDuplicationResult> {
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
		const logger = createLogger("copyFiles");

		const graph = await fetch(agent.graphUrl).then(
			(res) => res.json() as unknown as Graph,
		);

		if (targetNode.content.type !== "files") {
			return { result: "error", message: "Invalid target file node" };
		}

		const newNodes = await Promise.all(
			graph.nodes.map(async (node) => {
				if (node.content.type !== "files") {
					return null;
				}

				if (node.id !== targetNode.id) {
					return null;
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
					id: createNodeId(),
					name: `Copy of ${node.name}`,
					content: {
						...node.content,
						data: newData,
					},
					position: {
						x: node.position.x + 400,
						y: node.position.y + 100,
					},
				} as Node;
			}),
		).then((nodes) => nodes.filter((node) => node !== null));

		const { url } = await putGraph({
			...graph,
			nodes: [...graph.nodes, ...newNodes],
		});

		await db
			.update(agents)
			.set({
				graphUrl: url,
			})
			.where(eq(agents.id, agentId));

		waitForTelemetryExport();

		return {
			result: "success",
			message: "Success to copy files",
		};
	} catch (error) {
		return {
			result: "error",
			message: `Failed to copy files: ${error instanceof Error ? error.message : "Unknown error"}`,
		};
	}
}
