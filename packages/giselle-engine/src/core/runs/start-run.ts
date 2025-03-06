import type { RunId, RunningRun } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { getRun, setRun } from "./utils";

export async function startRun(args: {
	runId: RunId;
	context: GiselleEngineContext;
}) {
	const run = await getRun({
		storage: args.context.storage,
		runId: args.runId,
	});
	if (run === undefined) {
		throw new Error("Run not found");
	}
	if (run.status !== "queued") {
		throw new Error("Run not queued");
	}
	await setRun({
		storage: args.context.storage,
		run: {
			...run,
			status: "running",
			startedAt: Date.now(),
		} satisfies RunningRun,
	});
}
