"use server";

import { createRequestStack, runStep, startRequest } from "../actions";
import { runStackGenerator, updateRequestStatus } from "../actions/run";
import { requestStatus } from "../types";
import type { StartRunnerArgs } from "./types";

export const start = async (args: StartRunnerArgs) => {
	await startRequest(args.requestId);
	const requestStack = await createRequestStack({ requestId: args.requestId });
	for await (const step of runStackGenerator(requestStack.id)) {
		await runStep(args.requestId, requestStack.id, step.id);
	}
};
