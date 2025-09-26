import { defineConfig, type LogLevel } from "@trigger.dev/sdk";

export default defineConfig({
	project: "proj_ovqailxxoekfmedleqrv",
	runtime: "node",
	logLevel: (process.env.LOG_LEVEL ?? "info") as LogLevel,
	// The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
	// You can override this on an individual task.
	// See https://trigger.dev/docs/runs/max-duration
	maxDuration: 3600,
	retries: {
		enabledInDev: true,
		default: {
			maxAttempts: 3,
			minTimeoutInMs: 1000,
			maxTimeoutInMs: 10000,
			factor: 2,
			randomize: true,
		},
	},
	dirs: ["trigger"],
});
