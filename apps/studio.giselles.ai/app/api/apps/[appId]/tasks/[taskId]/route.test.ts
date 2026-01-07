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
			getTask: vi.fn(),
		},
	};
});

import { AppId, TaskId } from "@giselles-ai/protocol";
import { giselle } from "@/app/giselle";
import { db } from "@/db";
import { verifyApiSecretForTeam } from "@/lib/api-keys";
import { GET } from "./route";

describe("GET /api/apps/[appId]/tasks/[taskId]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	function makeNextRequest(url: string, init?: RequestInit) {
		const request = new Request(url, init);
		return Object.assign(request, {
			nextUrl: new URL(url),
		}) as unknown as Parameters<typeof GET>[0];
	}

	it("returns 401 when team API key verification fails", async () => {
		const appId = AppId.generate();
		const taskId = TaskId.generate();

		// @ts-expect-error - mocked shape
		db.select.mockReturnValue({
			from: () => ({
				where: () => ({
					limit: async () => [{ teamDbId: 123 }],
				}),
			}),
		});

		// @ts-expect-error - mocked function
		verifyApiSecretForTeam.mockResolvedValue({ ok: false, reason: "invalid" });

		const request = makeNextRequest("https://example.com", {
			headers: { authorization: "Bearer gsk-test.secret" },
		});

		const response = await GET(request, {
			params: Promise.resolve({ appId, taskId }),
		});

		expect(response.status).toBe(401);
	});

	it("returns task status JSON when team API key verification succeeds", async () => {
		const appId = AppId.generate();
		const taskId = TaskId.generate();

		// @ts-expect-error - mocked shape
		db.select.mockReturnValue({
			from: () => ({
				where: () => ({
					limit: async () => [{ teamDbId: 123 }],
				}),
			}),
		});

		// @ts-expect-error - mocked function
		verifyApiSecretForTeam.mockResolvedValue({ ok: true, apiKeyId: "apk_1" });

		// @ts-expect-error - mocked function
		giselle.getTask.mockResolvedValue({
			id: taskId,
			status: "inProgress",
			starter: { type: "app", appId },
			sequences: [],
		});

		const request = makeNextRequest("https://example.com", {
			headers: { authorization: "Bearer gsk-test.secret" },
		});

		const response = await GET(request, {
			params: Promise.resolve({ appId, taskId }),
		});

		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json).toEqual({
			task: {
				id: taskId,
				status: "inProgress",
				starter: { type: "app", appId },
				sequences: [],
			},
		});
	});
});
