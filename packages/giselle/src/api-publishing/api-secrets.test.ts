import { noopLogger } from "@giselles-ai/logger";
import {
	ApiSecretRecord,
	App,
	AppId,
	AppParameterId,
	NodeId,
	WorkspaceId,
} from "@giselles-ai/protocol";
import { memoryStorageDriver } from "@giselles-ai/storage";
import { describe, expect, test } from "vitest";
import { apiSecretPath, appPath } from "../path";
import type { GiselleContext } from "../types";
import {
	createApiSecret,
	revokeApiSecret,
	verifyApiSecretForApp,
} from "./api-secrets";
import { parseApiToken, parseAuthorizationHeader } from "./token";

describe("api publishing token parsing", () => {
	test("parseApiToken parses gsk_{apiKeyId}.{secret}", () => {
		const token = "gsk_apk-1234567890abcdef.s3cr3t";
		const parsed = parseApiToken(token);
		expect(parsed).toEqual({
			apiKeyId: "apk-1234567890abcdef",
			secret: "s3cr3t",
		});
	});

	test("parseApiToken returns null for invalid prefix", () => {
		expect(parseApiToken("sk_apk-123.s3cr3t")).toBeNull();
	});

	test("parseAuthorizationHeader parses Bearer tokens", () => {
		const parsed = parseAuthorizationHeader(
			"Bearer gsk_apk-1234567890abcdef.s3cr3t",
		);
		expect(parsed?.apiKeyId).toBe("apk-1234567890abcdef");
		expect(parsed?.secret).toBe("s3cr3t");
	});

	test("parseAuthorizationHeader returns null when missing", () => {
		expect(parseAuthorizationHeader(null)).toBeNull();
	});
});

function createTestContext(): GiselleContext {
	return {
		storage: memoryStorageDriver({}),
		apiSecretPepper: "test-pepper",
		// Not used by api-publishing functions, but required by the context type.
		vault: {
			encrypt: async (v: string) => v,
			decrypt: async (v: string) => v,
		},
		llmProviders: [],
		logger: noopLogger,
		waitUntil: (promise) => promise,
		generateContentProcess: { type: "self" },
		runTaskProcess: { type: "self" },
		experimental_contentGenerationNode: false,
	};
}

describe("api publishing key lifecycle", () => {
	test("createApiSecret fails when apiSecretPepper is missing", async () => {
		const context = createTestContext();
		context.apiSecretPepper = undefined;
		const appId = AppId.generate();
		const app = {
			id: appId,
			version: "v1",
			state: "disconnected",
			description: "",
			parameters: [
				{
					id: AppParameterId.generate(),
					name: "Prompt",
					type: "multiline-text",
					required: true,
				},
			],
			entryNodeId: NodeId.generate(),
			workspaceId: WorkspaceId.generate(),
		} as const;

		await context.storage.setJson({ path: appPath(appId), data: app });

		await expect(
			createApiSecret({ context, input: { appId } }),
		).rejects.toThrow(/apiSecretPepper is not configured/i);
	});

	test("createApiSecret stores record and updates app.apiPublishing", async () => {
		const context = createTestContext();
		const appId = AppId.generate();
		const app = {
			id: appId,
			version: "v1",
			state: "disconnected",
			description: "",
			parameters: [
				{
					id: AppParameterId.generate(),
					name: "Prompt",
					type: "multiline-text",
					required: true,
				},
			],
			entryNodeId: NodeId.generate(),
			workspaceId: WorkspaceId.generate(),
		} as const;

		await context.storage.setJson({ path: appPath(appId), data: app });

		const result = await createApiSecret({ context, input: { appId } });
		expect(result.token.startsWith(`gsk_${result.record.id}.`)).toBe(true);

		const storedApp = await context.storage.getJson({
			path: appPath(appId),
			schema: App,
		});
		expect(storedApp.apiPublishing?.isEnabled).toBe(true);
		expect(storedApp.apiPublishing?.apiKeyId).toBe(result.record.id);

		const storedRecord = await context.storage.getJson({
			path: apiSecretPath(result.record.id),
			schema: ApiSecretRecord,
		});
		expect(storedRecord.id).toBe(result.record.id);
		expect(storedRecord.kdf.type).toBe("hmac-sha256");
	});

	test("createApiSecret revokes the previous key (single-active)", async () => {
		const context = createTestContext();
		const appId = AppId.generate();
		const app = {
			id: appId,
			version: "v1",
			state: "disconnected",
			description: "",
			parameters: [
				{
					id: AppParameterId.generate(),
					name: "Prompt",
					type: "multiline-text",
					required: true,
				},
			],
			entryNodeId: NodeId.generate(),
			workspaceId: WorkspaceId.generate(),
		} as const;

		await context.storage.setJson({ path: appPath(appId), data: app });

		const first = await createApiSecret({ context, input: { appId } });
		const second = await createApiSecret({ context, input: { appId } });

		const firstRecord = await context.storage.getJson({
			path: apiSecretPath(first.record.id),
			schema: ApiSecretRecord,
		});
		expect(firstRecord.revokedAt).toBeTypeOf("number");

		const secondRecord = await context.storage.getJson({
			path: apiSecretPath(second.record.id),
			schema: ApiSecretRecord,
		});
		expect(secondRecord.revokedAt).toBeUndefined();
	});

	test("verifyApiSecretForApp accepts a valid token and rejects after revoke", async () => {
		const context = createTestContext();
		const appId = AppId.generate();
		const app = {
			id: appId,
			version: "v1",
			state: "disconnected",
			description: "",
			parameters: [
				{
					id: AppParameterId.generate(),
					name: "Prompt",
					type: "multiline-text",
					required: true,
				},
			],
			entryNodeId: NodeId.generate(),
			workspaceId: WorkspaceId.generate(),
		} as const;

		await context.storage.setJson({ path: appPath(appId), data: app });

		const created = await createApiSecret({ context, input: { appId } });

		const ok = await verifyApiSecretForApp({
			context,
			appId,
			authorizationHeader: `Bearer ${created.token}`,
		});
		expect(ok.ok).toBe(true);

		await revokeApiSecret({ context, input: { appId } });

		const denied = await verifyApiSecretForApp({
			context,
			appId,
			authorizationHeader: `Bearer ${created.token}`,
		});
		expect(denied.ok).toBe(false);
	});
});
