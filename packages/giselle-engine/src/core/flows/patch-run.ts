import type { GiselleEngineContext } from "../types";
import type { FlowRunId, FlowRunObject } from "./run/object";
import { type PatchDelta, patchFlowRun } from "./run/patch-object";
import { flowRunPath } from "./run/paths";

export type { PatchDelta };

export async function patchRun(args: {
	context: GiselleEngineContext;
	flowRunId: FlowRunId;
	delta: PatchDelta;
}) {
	// Get the current flow run
	const currentFlowRun = await args.context.storage.getItem<FlowRunObject>(
		flowRunPath(args.flowRunId),
	);

	if (!currentFlowRun) {
		throw new Error(`Flow run not found: ${args.flowRunId}`);
	}

	// Apply the patch
	const updatedFlowRun = patchFlowRun(currentFlowRun, {
		...args.delta,
		updatedAt: { set: Date.now() },
	});

	await args.context.storage.setItem(
		flowRunPath(args.flowRunId),
		updatedFlowRun,
	);

	return updatedFlowRun;
}
