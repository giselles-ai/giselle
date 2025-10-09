/**
 * Cron job endpoint for document embedding ingestion
 *
 * This endpoint processes documents that were not successfully ingested during upload:
 * - Documents in 'idle' status: Initial ingestion not yet attempted or failed to start
 * - Documents in 'running' status for >15 minutes: Likely interrupted by timeout
 *
 * Documents with 'failed' status are NOT retried by this cron job.
 * Failed status indicates permanent errors (e.g., unsupported file type, missing API keys,
 * invalid embedding profiles) that would fail repeatedly. Users should re-upload or
 * fix configuration issues for these documents.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import {
	createDocumentCronIngestTrigger,
	ingestDocument,
} from "@/lib/vector-stores/document/ingest";
import { fetchIngestTargets } from "./fetch-ingest-targets";

export const maxDuration = 800;

const bearerPrefix = "Bearer ";

const digest = (value: string) =>
	createHash("sha256").update(value, "utf8").digest();

const isAuthorized = (authHeader: string | null, secret: string) => {
	if (!authHeader?.startsWith(bearerPrefix)) {
		return false;
	}

	const providedSecret = authHeader.slice(bearerPrefix.length).trim();

	if (providedSecret.length === 0) {
		return false;
	}

	return timingSafeEqual(digest(secret), digest(providedSecret));
};

export async function GET(request: NextRequest) {
	const cronSecret = process.env.CRON_SECRET;

	if (!cronSecret) {
		console.error("CRON_SECRET environment variable is not set");
		return new Response("Server misconfigured", { status: 500 });
	}

	const authHeader = request.headers.get("authorization");
	if (!isAuthorized(authHeader, cronSecret)) {
		return new Response("Unauthorized", {
			status: 401,
		});
	}

	const targets = await fetchIngestTargets();

	// Process documents sequentially to avoid overwhelming the embedding API
	let successCount = 0;
	let failureCount = 0;
	let skippedCount = 0;

	for (const target of targets) {
		try {
			const result = await ingestDocument(target.sourceId, {
				embeddingProfileIds: target.embeddingProfileIds,
				trigger: createDocumentCronIngestTrigger(),
			});

			if (result.skipped) {
				// Already being processed by another cron instance
				skippedCount++;
				continue;
			}

			successCount++;
		} catch (error) {
			console.error(
				`Failed to ingest document ${target.sourceId}:`,
				error instanceof Error ? error.message : error,
			);
			failureCount++;
		}
	}

	return Response.json(
		{
			processed: targets.length,
			success: successCount,
			failure: failureCount,
			skipped: skippedCount,
		},
		{ status: 200 },
	);
}
