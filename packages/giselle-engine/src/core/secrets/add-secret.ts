import {
	type Secret,
	SecretId,
	SecretIndex,
	type WorkspaceId,
} from "@giselle-sdk/data-type";
import type { Storage } from "unstorage";
import { z } from "zod/v4";
import type { GiselleEngineContext } from "../types";
import { secretPath, workspaceSecretIndexPath } from "./paths";

export async function addSecret(args: {
	context: GiselleEngineContext;
	label: string;
	value: string;
	workspaceId: WorkspaceId;
}) {
	if (!args.context.vault) {
		throw new Error("Vault unavailable; cannot encrypt secret");
	}

	const encryptedValue = await args.context.vault.encrypt(args.value);

	const secret: Secret = {
		id: SecretId.generate(),
		label: args.label,
		value: encryptedValue,
		createdAt: Date.now(),
		workspaceId: args.workspaceId,
	};

	await Promise.all([
		args.context.storage.setItem(secretPath(secret.id), secret),
		addWorkspaceSecretIndex({
			storage: args.context.storage,
			secret,
			workspaceId: args.workspaceId,
		}),
	]);
	return secret.id;
}

async function addWorkspaceSecretIndex(args: {
	workspaceId: WorkspaceId;
	secret: Secret;
	storage: Storage;
}) {
	const workspaceSecretIndexLike = await args.storage.getItem(
		workspaceSecretIndexPath(args.workspaceId),
	);
	const parse = z.array(SecretIndex).safeParse(workspaceSecretIndexLike);
	const current = parse.success ? parse.data : [];

	await args.storage.setItem(workspaceSecretIndexPath(args.workspaceId), [
		...current,
		SecretIndex.parse(args.secret),
	]);
}
