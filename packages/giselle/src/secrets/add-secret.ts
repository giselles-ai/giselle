import {
	Secret,
	SecretId,
	SecretIndex,
	type WorkspaceId,
} from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../contracts";
import { addWorkspaceIndexItem } from "../utils/workspace-index";
import { secretPath, workspaceSecretIndexPath } from "./paths";

export async function addSecret({
	context,
	label,
	value,
	workspaceId,
	tags,
}: {
	context: GiselleEngineContext;
	label: string;
	value: string;
	workspaceId: WorkspaceId;
	tags?: string[];
}) {
	const encryptedValue = await context.vault.encrypt(value);

	const secret: Secret = {
		id: SecretId.generate(),
		label,
		value: encryptedValue,
		createdAt: Date.now(),
		workspaceId,
		tags,
	};

	await Promise.all([
		context.storage.setJson({
			path: secretPath(secret.id),
			data: secret,
			schema: Secret,
		}),
		addWorkspaceIndexItem({
			context,
			indexPath: workspaceSecretIndexPath(workspaceId),
			item: secret,
			itemSchema: SecretIndex,
		}),
	]);
	return secret;
}
