import type { NextRequest } from "next/server";
import { processRepository } from "@/lib/vector-stores/github";
import { fetchIngestTargets } from "./fetch-ingest-targets";

export const maxDuration = 800;

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
		return new Response("Unauthorized", {
			status: 401,
		});
	}

	const targetGitHubRepositories = await fetchIngestTargets();

	await Promise.all(targetGitHubRepositories.map(processRepository));

	return new Response("ok", { status: 200 });
}
