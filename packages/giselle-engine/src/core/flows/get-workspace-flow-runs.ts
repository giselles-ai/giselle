import type { WorkspaceId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { getWorkspaceIndex } from "../utils/workspace-index";
import { FlowRunIndexObject, FlowRunObject } from "./run/object";
import { flowRunPath, workspaceFlowRunPath } from "./run/paths";

export async function getWorkspaceFlowRuns(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
}) {
	const workspaceFlowRunIndices = await getWorkspaceIndex({
		storage: args.context.storage,
		indexPath: workspaceFlowRunPath(args.workspaceId),
		itemSchema: FlowRunIndexObject,
	});
	return await Promise.all(
		workspaceFlowRunIndices.map((workspaceFlowRunIndex) =>
			args.context.storage.getItem(flowRunPath(workspaceFlowRunIndex.id)),
		),
	).then((flowRunLike) =>
		flowRunLike
			.map((data) => {
				const parse = FlowRunObject.safeParse(data);
				if (parse.success) {
					return parse.data;
				}
				return null;
			})
			.filter((data) => data !== null),
	);
}
