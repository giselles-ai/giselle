import { Run, type RunId } from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";

export function runPath(runId: RunId) {
	return `runs/${runId}/run.json`;
}

export async function setRun({
	storage,
	run,
}: {
	storage: Storage;
	run: Run;
}) {
	switch (run.status) {
		case "queued":
			return await storage.set(runPath(run.id), Run.parse(run), {
				// Disable caching by setting cacheControlMaxAge to 0 for Vercel Blob storage
				cacheControlMaxAge: 0,
			});
	}
}

export async function getRun({
	storage,
	runId,
}: {
	storage: Storage;
	runId: RunId;
}): Promise<Run | undefined> {
	const run = await storage.get(runPath(runId));
	if (run == null) {
		return undefined;
	}
	return Run.parse(run);
}
