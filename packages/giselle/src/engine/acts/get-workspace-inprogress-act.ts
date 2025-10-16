import type { WorkspaceId } from "@giselle-sdk/data-type";
import { Act, ActIndexObject } from "../../concepts/act";
import type { GiselleEngineContext } from "../types";
import { getWorkspaceIndex } from "../utils/workspace-index";
import { actPath, workspaceActPath } from "./object/paths";

export async function getWorkspaceInprogressAct({
	context,
	workspaceId,
}: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
}) {
	context.logger.debug("getWorkspaceInprogressAct");
	const workspaceActIndexes = await getWorkspaceIndex({
		context,
		indexPath: workspaceActPath(workspaceId),
		itemSchema: ActIndexObject,
		useExperimentalStorage: true,
	});
	context.logger.debug(
		{ workspaceActIndices: workspaceActIndexes },
		"workspaceActIndices:",
	);
	const workspaceActs = (
		await Promise.all(
			workspaceActIndexes.map(async (workspaceActIndex) => {
				try {
					return await context.experimental_storage.getJson({
						path: actPath(workspaceActIndex.id),
						schema: Act,
					});
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					context.logger.warn(
						{
							actId: workspaceActIndex.id,
							error: errorMessage,
						},
						"Failed to load workspace act; skipping.",
					);
					return null;
				}
			}),
		)
	).filter((act): act is Act => act !== null);
	context.logger.debug({ workspaceActs }, "workspaceActs:");
	const inprogressActs = workspaceActs
		.sort((a, b) => b.createdAt - a.createdAt)
		.filter((a) => a.status === "inProgress");
	context.logger.debug({ inprogressActs }, "inprogressActs:");
	if (inprogressActs.length === 0) {
		context.logger.debug("inprogress acts none");
		return undefined;
	}
	if (inprogressActs.length > 1) {
		context.logger.warn(
			`workspace(${workspaceId}) has ${inprogressActs.length} acts.`,
		);
	}
	context.logger.debug(`return inprogress act(${inprogressActs[0].id})`);
	return inprogressActs[0];
}
