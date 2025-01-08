"use server";

import { agents, db } from "@/drizzle";
import {
	ExternalServiceName,
	VercelBlobOperation,
	createLogger,
	waitForTelemetryExport,
	withCountMeasurement,
} from "@/lib/opentelemetry";
import { buildGraphFolderPath, buildGraphPath } from "@giselles-ai/lib/utils";
import type { AgentId, Graph } from "@giselles-ai/types";
import { del, list, put } from "@vercel/blob";
import { eq } from "drizzle-orm";

export async function putGraph(graph: Graph) {
	const startTime = Date.now();
	const stringifiedGraph = JSON.stringify(graph);
	const result = await withCountMeasurement(
		createLogger("put-graph"),
		async () => {
			const result = await put(buildGraphPath(graph.id), stringifiedGraph, {
				access: "public",
			});

			return {
				blob: result,
				size: new TextEncoder().encode(stringifiedGraph).length,
			};
		},
		ExternalServiceName.VercelBlob,
		startTime,
		VercelBlobOperation.Put,
	);
	waitForTelemetryExport();
	return result.blob;
}

export async function persistGraph({
	graph,
	agentId,
}: { graph: Graph; agentId: AgentId }) {
	const startTime = Date.now();
	const { url } = await putGraph(graph);

	await db
		.update(agents)
		.set({
			graphUrl: url,
		})
		.where(eq(agents.id, agentId));

	const logger = createLogger("persistGraph");
	const { blobList } = await withCountMeasurement(
		logger,
		async () => {
			const result = await list({
				prefix: buildGraphFolderPath(graph.id),
				mode: "folded",
			});
			const size = result.blobs.reduce((sum, blob) => sum + blob.size, 0);
			return {
				blobList: result,
				size,
			};
		},
		ExternalServiceName.VercelBlob,
		startTime,
		VercelBlobOperation.List,
	);

	const oldBlobs = blobList.blobs
		.filter((blob) => blob.url !== url)
		.map((blob) => ({
			url: blob.url,
			size: blob.size,
		}));

	if (oldBlobs.length > 0) {
		await withCountMeasurement(
			logger,
			async () => {
				await del(oldBlobs.map((blob) => blob.url));
				const totalSize = oldBlobs.reduce((sum, blob) => sum + blob.size, 0);
				return {
					size: totalSize,
				};
			},
			ExternalServiceName.VercelBlob,
			startTime,
			VercelBlobOperation.Del,
		);
		waitForTelemetryExport();
	}

	return url;
}
