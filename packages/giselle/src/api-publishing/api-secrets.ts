import {
	createHmac,
	randomBytes,
	type ScryptOptions,
	scrypt as scryptCb,
	timingSafeEqual,
} from "node:crypto";
import {
	ApiKeyId,
	type ApiSecretKdf,
	ApiSecretRecord,
	type ApiSecretRecord as ApiSecretRecordType,
	App,
	AppId,
} from "@giselles-ai/protocol";
import * as z from "zod/v4";
import { apiSecretPath, appPath } from "../path";
import type { GiselleContext } from "../types";
import { createGiselleFunction } from "../utils/create-giselle-function";
import { parseAuthorizationHeader } from "./token";

async function scryptAsync(
	password: string,
	salt: Buffer,
	keyLen: number,
	options: ScryptOptions,
): Promise<Buffer> {
	return await new Promise((resolve, reject) => {
		scryptCb(password, salt, keyLen, options, (error, derivedKey) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(derivedKey as Buffer);
		});
	});
}

function randomSecretBytes(): Buffer {
	// 32 bytes of entropy is enough for a long-lived bearer token secret.
	return randomBytes(32);
}

async function computeScryptHash(args: {
	secret: string;
	saltBase64: string;
	params: Extract<ApiSecretKdf, { type: "scrypt" }>["params"];
}): Promise<string> {
	const salt = Buffer.from(args.saltBase64, "base64");
	const derived = await scryptAsync(args.secret, salt, args.params.keyLen, {
		N: args.params.n,
		r: args.params.r,
		p: args.params.p,
	});
	return derived.toString("base64");
}

function constantTimeEqualBase64(aBase64: string, bBase64: string): boolean {
	const a = Buffer.from(aBase64, "base64");
	const b = Buffer.from(bBase64, "base64");
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

function computeHmacSha256Base64(args: {
	pepper: string;
	secret: string;
}): string {
	return createHmac("sha256", Buffer.from(args.pepper, "utf8"))
		.update(args.secret, "utf8")
		.digest("base64");
}

function requireApiSecretPepper(context: GiselleContext): string {
	const pepper = context.apiSecretPepper;
	if (pepper === undefined || pepper.length === 0) {
		throw new Error(
			"apiSecretPepper is not configured (set GISELLE_API_SECRET_PEPPER)",
		);
	}
	return pepper;
}

async function getAppOrThrow(context: GiselleContext, appId: AppId) {
	return await context.storage.getJson({
		path: appPath(appId),
		schema: App,
	});
}

async function getApiSecretRecord(
	context: GiselleContext,
	apiKeyId: ApiKeyId,
): Promise<ApiSecretRecordType> {
	return await context.storage.getJson({
		path: apiSecretPath(apiKeyId),
		schema: ApiSecretRecord,
	});
}

async function setApiSecretRecord(
	context: GiselleContext,
	record: ApiSecretRecordType,
): Promise<void> {
	await context.storage.setJson({
		path: apiSecretPath(record.id),
		schema: ApiSecretRecord,
		data: record,
	});
}

export const createApiSecret = createGiselleFunction({
	input: z.object({
		appId: AppId.schema,
	}),
	handler: async ({ context, input }) => {
		const pepper = requireApiSecretPepper(context);
		const app = await getAppOrThrow(context, input.appId);

		const apiKeyId = ApiKeyId.generate();
		const secret = randomSecretBytes().toString("base64url");
		const secretHash = computeHmacSha256Base64({ pepper, secret });

		const record: ApiSecretRecordType = {
			id: apiKeyId,
			appId: input.appId,
			kdf: {
				type: "hmac-sha256",
				pepperVersion: "v1",
			},
			secretHash,
			createdAt: Date.now(),
		};

		// single-active: revoke previous key if present
		const previousKeyId = app.apiPublishing?.apiKeyId;
		if (previousKeyId) {
			try {
				const prev = await getApiSecretRecord(context, previousKeyId);
				if (!prev.revokedAt) {
					await setApiSecretRecord(context, { ...prev, revokedAt: Date.now() });
				}
			} catch {
				// best-effort: do not fail key creation if the old record is missing
			}
		}

		await setApiSecretRecord(context, record);

		const nextApp = {
			...app,
			apiPublishing: {
				isEnabled: true,
				apiKeyId,
			},
		};

		await context.storage.setJson({
			path: appPath(app.id),
			schema: App,
			data: nextApp,
		});

		return {
			token: `gsk_${apiKeyId}.${secret}` as const,
			record: {
				id: record.id,
				createdAt: record.createdAt,
				revokedAt: record.revokedAt,
				lastUsedAt: record.lastUsedAt,
			},
			app: nextApp,
		};
	},
});

export const revokeApiSecret = createGiselleFunction({
	input: z.object({
		appId: AppId.schema,
	}),
	handler: async ({ context, input }) => {
		const app = await getAppOrThrow(context, input.appId);
		const apiKeyId = app.apiPublishing?.apiKeyId;
		if (!apiKeyId) {
			return { app };
		}

		try {
			const record = await getApiSecretRecord(context, apiKeyId);
			if (!record.revokedAt) {
				await setApiSecretRecord(context, { ...record, revokedAt: Date.now() });
			}
		} catch {
			// ignore missing record
		}

		const nextApp = {
			...app,
			apiPublishing: {
				isEnabled: false,
				apiKeyId: undefined,
			},
		};

		await context.storage.setJson({
			path: appPath(app.id),
			schema: App,
			data: nextApp,
		});

		return { app: nextApp };
	},
});

export const getCurrentApiSecretRecordForApp = createGiselleFunction({
	input: z.object({
		appId: AppId.schema,
	}),
	handler: async ({ context, input }) => {
		const app = await getAppOrThrow(context, input.appId);
		const apiKeyId = app.apiPublishing?.apiKeyId;
		if (!apiKeyId) {
			return { record: null };
		}
		try {
			const record = await getApiSecretRecord(context, apiKeyId);
			return {
				record: {
					id: record.id,
					createdAt: record.createdAt,
					lastUsedAt: record.lastUsedAt,
					revokedAt: record.revokedAt,
				},
			};
		} catch {
			return { record: null };
		}
	},
});

export async function verifyApiSecretForApp(args: {
	context: GiselleContext;
	appId: AppId;
	authorizationHeader: string | null;
}): Promise<
	| { ok: true; apiKeyId: ApiKeyId; record: ApiSecretRecordType }
	| { ok: false; reason: "missing" | "invalid" | "revoked" | "mismatch" }
> {
	const parsed = parseAuthorizationHeader(args.authorizationHeader);
	if (!parsed) {
		return {
			ok: false,
			reason: args.authorizationHeader ? "invalid" : "missing",
		};
	}

	const apiKeyIdParse = ApiKeyId.safeParse(parsed.apiKeyId);
	if (!apiKeyIdParse.success) {
		return { ok: false, reason: "invalid" };
	}
	const apiKeyId = apiKeyIdParse.data;

	let record: ApiSecretRecordType;
	try {
		record = await getApiSecretRecord(args.context, apiKeyId);
	} catch {
		return { ok: false, reason: "invalid" };
	}

	if (record.appId !== args.appId) {
		return { ok: false, reason: "mismatch" };
	}
	if (record.revokedAt) {
		return { ok: false, reason: "revoked" };
	}

	let computed: string;
	switch (record.kdf.type) {
		case "hmac-sha256": {
			const pepper = requireApiSecretPepper(args.context);
			computed = computeHmacSha256Base64({ pepper, secret: parsed.secret });
			break;
		}
		case "scrypt": {
			computed = await computeScryptHash({
				secret: parsed.secret,
				saltBase64: record.kdf.salt,
				params: record.kdf.params,
			});
			break;
		}
		default: {
			const _exhaustiveCheck: never = record.kdf;
			throw new Error(`Unsupported kdf: ${_exhaustiveCheck}`);
		}
	}

	if (!constantTimeEqualBase64(computed, record.secretHash)) {
		return { ok: false, reason: "invalid" };
	}

	// Best-effort lastUsedAt update
	try {
		const latest = await getApiSecretRecord(args.context, record.id);
		await setApiSecretRecord(args.context, {
			...latest,
			lastUsedAt: Date.now(),
		});
	} catch {
		// ignore
	}

	return { ok: true, apiKeyId, record };
}
