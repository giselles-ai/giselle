import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => {
	return {
		db: {
			select: vi.fn(),
		},
	};
});

vi.mock("@/db/schema", () => {
	return {
		apps: {
			id: "apps.id",
			teamDbId: "apps.teamDbId",
		},
		teams: {
			dbId: "teams.dbId",
			plan: "teams.plan",
		},
	};
});

vi.mock("@/lib/api-keys", () => {
	return {
		verifyApiSecretForTeam: vi.fn(),
	};
});

vi.mock("@/app/giselle", () => {
	return {
		giselle: {
			getApp: vi.fn(),
			uploadFile: vi.fn(),
		},
	};
});

vi.mock("../../../../_lib/rate-limit", () => {
	return {
		consumeTeamRateLimit: vi.fn(),
		buildRateLimitHeaders: vi.fn(() => new Headers()),
	};
});

import { AppId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import { verifyApiSecretForTeam } from "@/lib/api-keys";
import { consumeTeamRateLimit } from "../../../../_lib/rate-limit";
import { POST } from "./route";

describe("POST /api/apps/[appId]/files/upload", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function makeNextRequest(url: string, init?: RequestInit) {
		const request = new Request(url, init);
		return Object.assign(request, {
			nextUrl: new URL(url),
		}) as unknown as Parameters<typeof POST>[0];
	}

	it("returns 401 when app does not exist (avoid leaking existence)", async () => {
		const appId = AppId.generate();

		// @ts-expect-error - mocked shape
		db.select.mockReturnValue({
			from: () => ({
				innerJoin: () => ({
					where: () => ({
						limit: async () => [],
					}),
				}),
			}),
		});

		const request = makeNextRequest("https://example.com", {
			method: "POST",
		});

		const response = await POST(request, {
			params: Promise.resolve({ appId }),
		});

		expect(response.status).toBe(401);
	});

	it("returns 401 when team API key verification fails", async () => {
		const appId = AppId.generate();

		// @ts-expect-error - mocked shape
		db.select.mockReturnValue({
			from: () => ({
				innerJoin: () => ({
					where: () => ({
						limit: async () => [{ teamDbId: 123, plan: "free" }],
					}),
				}),
			}),
		});

		// @ts-expect-error - mocked function
		verifyApiSecretForTeam.mockResolvedValue({ ok: false, reason: "invalid" });

		const request = makeNextRequest("https://example.com", {
			method: "POST",
			headers: { authorization: "Bearer gsk-test.secret" },
		});

		const response = await POST(request, {
			params: Promise.resolve({ appId }),
		});

		expect(response.status).toBe(401);
	});

	it("returns 404 when app is not found after auth", async () => {
		const appId = AppId.generate();

		// @ts-expect-error - mocked shape
		db.select.mockReturnValue({
			from: () => ({
				innerJoin: () => ({
					where: () => ({
						limit: async () => [{ teamDbId: 123, plan: "free" }],
					}),
				}),
			}),
		});
		// @ts-expect-error - mocked function
		verifyApiSecretForTeam.mockResolvedValue({ ok: true, apiKeyId: "apk_1" });
		// @ts-expect-error - mocked function
		consumeTeamRateLimit.mockResolvedValue({
			allowed: true,
			limit: 60,
			remaining: 59,
			resetAt: new Date(),
			retryAfterSeconds: 0,
		});
		// @ts-expect-error - mocked function
		giselle.getApp.mockResolvedValue(null);

		const file = new File(["hello"], "hello.txt", { type: "text/plain" });
		const formData = new FormData();
		formData.append("file", file);
		const request = makeNextRequest("https://example.com", {
			method: "POST",
			headers: { authorization: "Bearer gsk-test.secret" },
			body: formData,
		});

		const response = await POST(request, {
			params: Promise.resolve({ appId }),
		});

		expect(response.status).toBe(404);
	});

	it("uploads file and returns UploadedFileData", async () => {
		const appId = AppId.generate();
		const workspaceId = "ws_123";

		// @ts-expect-error - mocked shape
		db.select.mockReturnValue({
			from: () => ({
				innerJoin: () => ({
					where: () => ({
						limit: async () => [{ teamDbId: 123, plan: "free" }],
					}),
				}),
			}),
		});
		// @ts-expect-error - mocked function
		verifyApiSecretForTeam.mockResolvedValue({ ok: true, apiKeyId: "apk_1" });
		// @ts-expect-error - mocked function
		consumeTeamRateLimit.mockResolvedValue({
			allowed: true,
			limit: 60,
			remaining: 59,
			resetAt: new Date(),
			retryAfterSeconds: 0,
		});
		// @ts-expect-error - mocked function
		giselle.getApp.mockResolvedValue({ workspaceId });
		// @ts-expect-error - mocked function
		giselle.uploadFile.mockResolvedValue(undefined);

		const file = new File(["hello"], "hello.txt", { type: "text/plain" });
		const formData = new FormData();
		formData.append("file", file);
		formData.append("fileName", "custom-name.txt");

		const request = makeNextRequest("https://example.com", {
			method: "POST",
			headers: { authorization: "Bearer gsk-test.secret" },
			body: formData,
		});

		const response = await POST(request, {
			params: Promise.resolve({ appId }),
		});

		expect(response.status).toBe(200);
		const json = await response.json();

		expect(json).toEqual({
			file: expect.objectContaining({
				id: expect.stringMatching(/^fl[-_]/),
				name: "custom-name.txt",
				type: "text/plain",
				size: file.size,
				status: "uploaded",
				uploadedAt: expect.any(Number),
			}),
		});

		expect(giselle.uploadFile).toHaveBeenCalledWith(
			file,
			workspaceId,
			json.file.id,
			"custom-name.txt",
		);
	});
});
