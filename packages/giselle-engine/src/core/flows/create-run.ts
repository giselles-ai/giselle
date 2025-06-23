import type { WorkspaceId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { addWorkspaceIndexItem } from "../utils/workspace-index";
import {
	FlowRunId,
	FlowRunIndexObject,
	type FlowRunObject,
} from "./run/object";
import { flowRunPath, workspaceFlowRunPath } from "./run/paths";

export async function createRun(args: {
	context: GiselleEngineContext;
	jobsCount: number;
	trigger: string;
	workspaceId: WorkspaceId;
}) {
	const flowRun: FlowRunObject = {
		id: FlowRunId.generate(),
		workspaceId: args.workspaceId,
		status: "inProgress",
		steps: {
			queued: args.jobsCount,
			inProgress: 0,
			warning: 0,
			completed: 0,
			failed: 0,
			cancelled: 0,
		},
		trigger: args.trigger,
		duration: {
			wallClock: 0,
			totalTask: 0,
		},
		usage: {
			promptTokens: 0,
			completionTokens: 0,
			totalTokens: 0,
		},
		createdAt: Date.now(),
		updatedAt: Date.now(),
		annotations: [],
	};
	await Promise.all([
		args.context.storage.setItem(flowRunPath(flowRun.id), flowRun),
		addWorkspaceIndexItem({
			storage: args.context.storage,
			indexPath: workspaceFlowRunPath(args.workspaceId),
			item: flowRun,
			itemSchema: FlowRunIndexObject,
		}),
	]);
	return flowRun;
}
