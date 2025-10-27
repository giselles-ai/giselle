import {
	Secret,
	SecretId,
	SecretIndex,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { addWorkspaceIndexItem } from "../utils/workspace-index";
import { secretPath, workspaceSecretIndexPath } from "./paths";

export async function addSecret({
	context,
	label,
	value,
	workspaceId,
	tags,
	useExperimentalStorage,
}: {
	context: GiselleEngineContext;
	label: string;
	value: string;
	workspaceId: WorkspaceId;
	tags?: string[];
	useExperimentalStorage: boolean;
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

	if (useExperimentalStorage) {
		await Promise.all([
			context.experimental_storage.setJson({
				path: secretPath(secret.id),
				data: secret,
				schema: Secret,
			}),
			addWorkspaceIndexItem({
				context,
				indexPath: workspaceSecretIndexPath(workspaceId),
				item: secret,
				itemSchema: SecretIndex,
				useExperimentalStorage: true,
			}),
		]);
		return secret;
	}

	await Promise.all([
		context.deprecated_storage.setItem(secretPath(secret.id), secret),
		addWorkspaceIndexItem({
			context,
			indexPath: workspaceSecretIndexPath(workspaceId),
			item: secret,
			itemSchema: SecretIndex,
		}),
	]);
	return secret;
}
