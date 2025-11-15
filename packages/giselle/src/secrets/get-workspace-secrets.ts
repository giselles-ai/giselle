import { SecretIndex, type WorkspaceId } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../contracts";
import { getWorkspaceIndex } from "../utils/workspace-index";
import { workspaceSecretIndexPath } from "./paths";

export async function getWorkspaceSecrets(args: {
	context: GiselleEngineContext;
	workspaceId: WorkspaceId;
	tags?: string[];
}) {
	const { context, workspaceId, tags } = args;
	const secrets = await getWorkspaceIndex({
		context,
		indexPath: workspaceSecretIndexPath(workspaceId),
		itemSchema: SecretIndex,
	});

	if (tags === undefined || tags.length === 0) {
		return secrets;
	}

	return secrets.filter((secret) => {
		const secretTags = secret.tags ?? [];
		return tags?.every((tag) => secretTags.includes(tag));
	});
}
