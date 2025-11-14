import type { WorkspaceId } from "@giselles-ai/protocol";
import { Act, ActIndexObject } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../../contracts";
import { getWorkspaceIndex } from "../utils/workspace-index";
import { actPath, workspaceActPath } from "./object/paths";

export async function getWorkspaceActs(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
}) {
	const workspaceActIndices = await getWorkspaceIndex({
		context: args.context,
		indexPath: workspaceActPath(args.workspaceId),
		itemSchema: ActIndexObject,
	});
	const workspaceActs = (
		await Promise.all(
			workspaceActIndices.map(async (workspaceActIndex) => {
				try {
					return await args.context.storage.getJson({
						path: actPath(workspaceActIndex.id),
						schema: Act,
					});
				} catch (error) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";
					args.context.logger.warn(
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
	return workspaceActs;
}
