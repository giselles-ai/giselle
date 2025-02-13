// import { start as startWithTriggerDev } from "./runners/trigger.dev";
import type { StartRunnerArgs } from "./runners/types";
import { start as startWithVercel } from "./runners/vercel-functions";

export { RequestRunner } from "./runners/react";

export const runOnVercel = async (args: StartRunnerArgs) =>
	await startWithVercel(args);
// export const runOnTriggerDev = async (args: StartRunnerArgs) =>
// 	await startWithTriggerDev(args);
