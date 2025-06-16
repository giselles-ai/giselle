import { SecretIndex, type WorkspaceId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { getWorkspaceIndex } from "../utils/workspace-index";
import { workspaceSecretIndexPath } from "./paths";

export async function getWorkspaceSecrets(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
}) {
	return await getWorkspaceIndex({
		storage: args.context.storage,
		indexPath: workspaceSecretIndexPath(args.workspaceId),
		itemSchema: SecretIndex,
	});
}
