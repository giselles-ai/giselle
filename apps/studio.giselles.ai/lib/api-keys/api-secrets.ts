import {
	randomBytes,
	type ScryptOptions,
	scrypt as scryptCb,
	timingSafeEqual,
} from "node:crypto";
import { performance } from "node:perf_hooks";
import { and, desc, eq } from "drizzle-orm";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import {
	ApiKeyId,
	type ApiSecretKdf,
	type ApiSecretRecord,
	apiKeys,
	users,
} from "@/db/schema";
import { logger } from "@/lib/logger";
import { parseAuthorizationHeader } from "./token";

type ApiSecretScryptParams = Extract<
	ApiSecretKdf,
	{ type: "scrypt" }
>["params"];

type ApiSecretScryptConfig = {
	params: ApiSecretScryptParams;
	saltBytes: number;
	logDuration: boolean;
};

export type ApiKeyListItem = {
	id: ApiKeyId;
	label: string | null;
	redactedValue: string;
	createdAt: Date;
	lastUsedAt: Date | null;
	revokedAt: Date | null;
	createdByName: string | null;
};

function buildRedactedValue(token: string): string {
	const prefix = token.slice(0, 6);
	const suffix = token.slice(-3);
	return `${prefix}...${suffix}`;
}

const defaultApiSecretScryptParams: ApiSecretScryptParams = {
	n: 16384,
	r: 8,
	p: 1,
	keyLen: 32,
};

const defaultApiSecretScryptSaltBytes = 16;

function getApiSecretScryptConfig(): ApiSecretScryptConfig {
	const config = giselle.getContext().apiSecretScrypt;
	return {
		params: config?.params ?? defaultApiSecretScryptParams,
		saltBytes: config?.saltBytes ?? defaultApiSecretScryptSaltBytes,
		logDuration: config?.logDuration ?? false,
	};
}

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
	return randomBytes(32);
}

async function computeScryptHash(args: {
	secret: string;
	saltBase64: string;
	params: ApiSecretScryptParams;
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

async function computeScryptHashWithOptionalLogging(args: {
	purpose: "create" | "verify";
	secret: string;
	saltBase64: string;
	config: ApiSecretScryptConfig;
}): Promise<string> {
	if (!args.config.logDuration) {
		return await computeScryptHash({
			secret: args.secret,
			saltBase64: args.saltBase64,
			params: args.config.params,
		});
	}

	const start = performance.now();
	const secretHash = await computeScryptHash({
		secret: args.secret,
		saltBase64: args.saltBase64,
		params: args.config.params,
	});
	const durationMs = performance.now() - start;

	logger.debug(
		{
			purpose: args.purpose,
			n: args.config.params.n,
			r: args.config.params.r,
			p: args.config.params.p,
			keyLen: args.config.params.keyLen,
			saltBytes: Buffer.from(args.saltBase64, "base64").length,
			durationMs,
		},
		"api secret scrypt derived",
	);

	return secretHash;
}

function buildScryptParamsFromRecord(
	record: ApiSecretRecord,
): ApiSecretScryptParams {
	return {
		n: record.kdfN,
		r: record.kdfR,
		p: record.kdfP,
		keyLen: record.kdfKeyLen,
	};
}

function toListItem(
	record: ApiSecretRecord,
	createdByName: string | null,
): ApiKeyListItem {
	return {
		id: record.id,
		label: record.label ?? null,
		redactedValue: record.redactedValue,
		createdAt: record.createdAt ?? new Date(),
		lastUsedAt: record.lastUsedAt ?? null,
		revokedAt: record.revokedAt ?? null,
		createdByName,
	};
}

export async function listApiSecretRecordsForTeam(teamDbId: number) {
	const rows = await db
		.select({
			record: apiKeys,
			createdByName: users.displayName,
		})
		.from(apiKeys)
		.leftJoin(users, eq(apiKeys.createdByUserDbId, users.dbId))
		.where(eq(apiKeys.teamDbId, teamDbId))
		.orderBy(desc(apiKeys.createdAt));

	return rows.map((row) => toListItem(row.record, row.createdByName));
}

export async function createApiSecret(args: {
	teamDbId: number;
	createdByUserDbId: number;
	label?: string | null;
}) {
	const config = getApiSecretScryptConfig();

	const apiKeyId = ApiKeyId.generate();
	const secret = randomSecretBytes().toString("base64url");
	const saltBase64 = randomBytes(config.saltBytes).toString("base64");
	const secretHash = await computeScryptHashWithOptionalLogging({
		purpose: "create",
		secret,
		saltBase64,
		config,
	});
	const token = `${apiKeyId}.${secret}` as const;
	const redactedValue = buildRedactedValue(token);

	const [inserted] = await db
		.insert(apiKeys)
		.values({
			id: apiKeyId,
			teamDbId: args.teamDbId,
			label: args.label ?? null,
			createdByUserDbId: args.createdByUserDbId,
			redactedValue,
			kdfType: "scrypt",
			kdfSalt: saltBase64,
			kdfN: config.params.n,
			kdfR: config.params.r,
			kdfP: config.params.p,
			kdfKeyLen: config.params.keyLen,
			secretHash,
		})
		.returning();

	const record = toListItem(inserted, null);

	return {
		token,
		record,
	};
}

export async function revokeApiSecret(args: {
	apiKeyId: ApiKeyId;
	teamDbId: number;
}) {
	const [existing] = await db
		.select({
			record: apiKeys,
		})
		.from(apiKeys)
		.where(
			and(eq(apiKeys.id, args.apiKeyId), eq(apiKeys.teamDbId, args.teamDbId)),
		)
		.limit(1);

	if (!existing) {
		return { revoked: false };
	}

	if (existing.record.revokedAt) {
		return { revoked: false };
	}

	await db
		.update(apiKeys)
		.set({ revokedAt: new Date() })
		.where(eq(apiKeys.id, args.apiKeyId));

	return { revoked: true };
}

export async function verifyApiSecretForTeam(args: {
	teamDbId: number;
	authorizationHeader: string | null;
}): Promise<
	| { ok: true; apiKeyId: ApiKeyId; record: ApiSecretRecord }
	| { ok: false; reason: "missing" | "invalid" | "revoked" | "mismatch" }
> {
	const parsed = parseAuthorizationHeader(args.authorizationHeader);
	if (!parsed) {
		return {
			ok: false,
			reason: args.authorizationHeader ? "invalid" : "missing",
		};
	}

	const apiKeyId = ApiKeyId.safeParse(parsed.apiKeyId);
	if (!apiKeyId.success) {
		return { ok: false, reason: "invalid" };
	}

	const record = await db.query.apiKeys.findFirst({
		where: (records, { eq }) => eq(records.id, apiKeyId.data),
	});

	if (!record) {
		return { ok: false, reason: "invalid" };
	}

	if (record.teamDbId !== args.teamDbId) {
		return { ok: false, reason: "mismatch" };
	}

	if (record.revokedAt) {
		return { ok: false, reason: "revoked" };
	}

	if (record.kdfType !== "scrypt") {
		return { ok: false, reason: "invalid" };
	}

	const config = getApiSecretScryptConfig();
	const computed = await computeScryptHashWithOptionalLogging({
		purpose: "verify",
		secret: parsed.secret,
		saltBase64: record.kdfSalt,
		config: {
			...config,
			params: buildScryptParamsFromRecord(record),
		},
	});

	if (!constantTimeEqualBase64(computed, record.secretHash)) {
		return { ok: false, reason: "invalid" };
	}

	try {
		const now = new Date();
		await db
			.update(apiKeys)
			.set({ lastUsedAt: now })
			.where(eq(apiKeys.id, record.id));
	} catch (error) {
		logger.warn({ error }, "failed to update api secret lastUsedAt");
	}

	return { ok: true, apiKeyId: apiKeyId.data, record };
}
