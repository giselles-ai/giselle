import {
	randomBytes,
	type ScryptOptions,
	scrypt as scryptCb,
	timingSafeEqual,
} from "node:crypto";
import { performance } from "node:perf_hooks";
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

const defaultApiSecretScryptParams = {
	n: 16384,
	r: 8,
	p: 1,
	keyLen: 32,
} satisfies Extract<ApiSecretKdf, { type: "scrypt" }>["params"];

const defaultApiSecretScryptSaltBytes = 16;

function getApiSecretScryptParams(
	context: GiselleContext,
): Extract<ApiSecretKdf, { type: "scrypt" }>["params"] {
	return context.apiSecretScrypt?.params ?? defaultApiSecretScryptParams;
}

function getApiSecretScryptSaltBytes(context: GiselleContext): number {
	return context.apiSecretScrypt?.saltBytes ?? defaultApiSecretScryptSaltBytes;
}

async function computeScryptHashWithOptionalLogging(args: {
	context: GiselleContext;
	purpose: "create" | "verify";
	secret: string;
	saltBase64: string;
	params: Extract<ApiSecretKdf, { type: "scrypt" }>["params"];
}): Promise<string> {
	if (!args.context.apiSecretScrypt?.logDuration) {
		return await computeScryptHash({
			secret: args.secret,
			saltBase64: args.saltBase64,
			params: args.params,
		});
	}

	const start = performance.now();
	const secretHash = await computeScryptHash({
		secret: args.secret,
		saltBase64: args.saltBase64,
		params: args.params,
	});
	const durationMs = performance.now() - start;

	args.context.logger.debug(
		{
			purpose: args.purpose,
			n: args.params.n,
			r: args.params.r,
			p: args.params.p,
			keyLen: args.params.keyLen,
			saltBytes: Buffer.from(args.saltBase64, "base64").length,
			durationMs,
		},
		"api secret scrypt derived",
	);

	return secretHash;
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
		const app = await getAppOrThrow(context, input.appId);

		const apiKeyId = ApiKeyId.generate();
		const secret = randomSecretBytes().toString("base64url");
		const params = getApiSecretScryptParams(context);
		const saltBase64 = randomBytes(
			getApiSecretScryptSaltBytes(context),
		).toString("base64");
		const secretHash = await computeScryptHashWithOptionalLogging({
			context,
			purpose: "create",
			secret,
			saltBase64,
			params,
		});

		const record: ApiSecretRecordType = {
			id: apiKeyId,
			appId: input.appId,
			kdf: {
				type: "scrypt",
				salt: saltBase64,
				params,
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

	const computed = await computeScryptHashWithOptionalLogging({
		context: args.context,
		purpose: "verify",
		secret: parsed.secret,
		saltBase64: record.kdf.salt,
		params: record.kdf.params,
	});

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
