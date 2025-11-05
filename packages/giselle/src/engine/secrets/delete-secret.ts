import { Secret, type SecretId, SecretIndex } from "@giselles-ai/protocol";
import { z } from "zod/v4";
import type { GiselleEngineContext } from "../types";
import { secretPath, workspaceSecretIndexPath } from "./paths";

export async function deleteSecret({
	context,
	secretId,
}: {
	context: GiselleEngineContext;
	secretId: SecretId;
}) {
	const path = secretPath(secretId);

	const exists = await context.storage.exists(path);
	if (!exists) {
		return;
	}
	const secret = await context.storage.getJson({
		path,
		schema: Secret,
	});
	await context.storage.remove(path);

	const indexPath = workspaceSecretIndexPath(secret.workspaceId);
	const hasIndex = await context.storage.exists(indexPath);
	if (!hasIndex) {
		return;
	}
	const index = await context.storage.getJson({
		path: indexPath,
		schema: z.array(SecretIndex),
	});
	const remaining = index.filter((item) => item.id !== secretId);
	if (remaining.length === 0) {
		await context.storage.remove(indexPath);
		return;
	}
	await context.storage.setJson({
		path: indexPath,
		data: remaining,
	});
	return;
}
