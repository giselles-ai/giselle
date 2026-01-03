import { createIdGenerator } from "@giselles-ai/utils";
import * as z from "zod/v4";
import { AppId } from "../app/app-id";

export const ApiKeyId = createIdGenerator("apk");
export type ApiKeyId = z.infer<typeof ApiKeyId.schema>;

const ApiSecretKdfScrypt = z.object({
	type: z.literal("scrypt"),
	salt: z.string(),
	params: z.object({
		n: z.number(),
		r: z.number(),
		p: z.number(),
		keyLen: z.number(),
	}),
});

const ApiSecretKdfHmacSha256 = z.object({
	type: z.literal("hmac-sha256"),
	pepperVersion: z.string().optional(),
});

export const ApiSecretKdf = z.union([
	ApiSecretKdfScrypt,
	ApiSecretKdfHmacSha256,
]);
export type ApiSecretKdf = z.infer<typeof ApiSecretKdf>;

export const ApiSecretRecord = z.object({
	id: ApiKeyId.schema,
	appId: AppId.schema,
	kdf: ApiSecretKdf,
	secretHash: z.string(),
	createdAt: z.number(),
	revokedAt: z.number().optional(),
	lastUsedAt: z.number().optional(),
});
export type ApiSecretRecord = z.infer<typeof ApiSecretRecord>;
