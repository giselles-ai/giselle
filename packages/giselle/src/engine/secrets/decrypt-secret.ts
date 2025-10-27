import { Secret, type SecretId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import { secretPath } from "./paths";

export async function decryptSecret(args: {
	context: GiselleEngineContext;
	secretId: SecretId;
	useExperimentalStorage: boolean;
}): Promise<string | undefined> {
	if (args.useExperimentalStorage) {
		const secret = await args.context.storage.getJson({
			path: secretPath(args.secretId),
			schema: Secret,
		});
		const decryptValue = await args.context.vault.decrypt(secret.value);
		if (!decryptValue) {
			return undefined;
		}

		return decryptValue;
	}
	const secretLike = await args.context.deprecated_storage.getItem(
		secretPath(args.secretId),
	);
	if (!secretLike) {
		return undefined;
	}
	const secret = Secret.parse(secretLike);

	const decryptValue = await args.context.vault.decrypt(secret.value);
	if (!decryptValue) {
		return undefined;
	}

	return decryptValue;
}
