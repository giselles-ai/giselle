import { Secret, type SecretId, SecretIndex } from "@giselle-sdk/data-type";
import { z } from "zod/v4";
import type { GiselleEngineContext } from "../types";
import { secretPath, workspaceSecretIndexPath } from "./paths";

export async function deleteSecret({
	context,
	secretId,
	useExperimentalStorage,
}: {
	context: GiselleEngineContext;
	secretId: SecretId;
	useExperimentalStorage: boolean;
}) {
	const path = secretPath(secretId);

	if (useExperimentalStorage) {
		const exists = await context.experimental_storage.exists(path);
		if (!exists) {
			return;
		}
		const secret = await context.experimental_storage.getJson({
			path,
			schema: Secret,
		});
		await context.experimental_storage.remove(path);

		const indexPath = workspaceSecretIndexPath(secret.workspaceId);
		const hasIndex = await context.experimental_storage.exists(indexPath);
		if (!hasIndex) {
			return;
		}
		const index = await context.experimental_storage.getJson({
			path: indexPath,
			schema: z.array(SecretIndex),
		});
		const remaining = index.filter((item) => item.id !== secretId);
		if (remaining.length === 0) {
			await context.experimental_storage.remove(indexPath);
			return;
		}
		await context.experimental_storage.setJson({
			path: indexPath,
			data: remaining,
		});
		return;
	}

	const secretLike = await context.deprecated_storage.getItem(path);
	if (secretLike === null) {
		return;
	}
	const secret = Secret.parse(secretLike);
	await context.deprecated_storage.removeItem(path);

	const indexPath = workspaceSecretIndexPath(secret.workspaceId);
	const indexLike = await context.deprecated_storage.getItem(indexPath);
	const parse = z.array(SecretIndex).safeParse(indexLike);
	if (!parse.success) {
		return;
	}
	const remaining = parse.data.filter((item) => item.id !== secretId);
	if (remaining.length === 0) {
		await context.deprecated_storage.removeItem(indexPath);
		return;
	}
	await context.deprecated_storage.setItem(indexPath, remaining);
}
