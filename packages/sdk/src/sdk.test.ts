import { describe, expect, it, vi } from "vitest";
import {
	ConfigurationError,
	TimeoutError,
	UnsupportedFeatureError,
} from "./errors";
import Giselle from "./sdk";

const mockTaskBase = {
	id: "tsk_1234567890123456",
	workspaceId: "wrks_1234567890123456",
	name: "My Task",
	trigger: "app",
	starter: { type: "app", appId: "app_1234567890123456" },
	steps: {
		queued: 0,
		inProgress: 0,
		completed: 0,
		warning: 0,
		cancelled: 0,
		failed: 0,
	},
	duration: { wallClock: 0, totalTask: 0 },
	usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
	createdAt: 1234567890,
	updatedAt: 1234567890,
	annotations: [],
	sequences: [],
};

describe("Giselle SDK (public Runs API)", () => {
	it("app.run() calls POST /api/apps/{appId}/run and returns task", async () => {
		const fetchMock = vi.fn((url: unknown, init?: RequestInit) => {
			expect(url).toBe(
				"https://example.com/api/apps/app_1234567890123456/run",
			);
			expect(init?.method).toBe("POST");
			const headersInit = init?.headers;
			const headers = new Headers(headersInit);
			expect(headers.get("Authorization")).toBe("Bearer gsk_test.secret");
			expect(headers.get("Content-Type")).toBe("application/json");
			expect(init?.body).toBe(JSON.stringify({ text: "hello" }));

			return new Response(
				JSON.stringify({ ...mockTaskBase, status: "created" }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		});

		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "gsk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		const result = await client.app.run({
			appId: "app_1234567890123456",
			input: { text: "hello" },
		});
		expect(result).toMatchObject({
			id: "tsk_1234567890123456",
			status: "created",
		});
	});

	it("defaults baseUrl to https://studio.giselles.ai", async () => {
		const fetchMock = vi.fn((url: unknown) => {
			expect(url).toBe(
				"https://studio.giselles.ai/api/apps/app_1234567890123456/run",
			);
			return Promise.resolve(
				new Response(JSON.stringify({ ...mockTaskBase, status: "created" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);
		});

		const client = new Giselle({
			apiKey: "gsk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		const result = await client.app.run({
			appId: "app_1234567890123456",
			input: { text: "hello" },
		});
		expect(result).toMatchObject({
			id: "tsk_1234567890123456",
		});
	});

	it("app.run() throws if apiKey is missing", async () => {
		const client = new Giselle({
			baseUrl: "https://example.com",
			fetch: vi.fn() as unknown as typeof fetch,
		});

		await expect(
			client.app.run({
				appId: "app_1234567890123456",
				input: { text: "hello" },
			}),
		).rejects.toBeInstanceOf(ConfigurationError);
	});

	it("app.run() rejects input.file (not supported yet)", async () => {
		const fetchMock = vi.fn();
		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "gsk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		await expect(
			client.app.run({
				appId: "app_1234567890123456",
				input: { text: "hello", file: "base64..." },
			}),
		).rejects.toBeInstanceOf(UnsupportedFeatureError);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("app.runAndWait() polls task status and returns final task result", async () => {
		let callIndex = 0;
		const fetchMock = vi.fn((url: unknown, init?: RequestInit) => {
			callIndex += 1;
			const headers = new Headers(init?.headers);

			if (callIndex === 1) {
				expect(url).toBe(
					"https://example.com/api/apps/app_1234567890123456/run",
				);
				expect(init?.method).toBe("POST");
				expect(headers.get("Authorization")).toBe("Bearer gsk_test.secret");
				expect(headers.get("Content-Type")).toBe("application/json");
				expect(init?.body).toBe(JSON.stringify({ text: "hello" }));

				return new Response(
					JSON.stringify({ ...mockTaskBase, status: "created" }),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			if (callIndex === 2) {
				expect(url).toBe(
					"https://example.com/api/apps/app_1234567890123456/tasks/tsk_1234567890123456",
				);
				expect(init?.method).toBe("GET");
				expect(headers.get("Authorization")).toBe("Bearer gsk_test.secret");

				return new Response(
					JSON.stringify({
						task: { ...mockTaskBase, status: "inProgress" },
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			if (callIndex === 3) {
				expect(url).toBe(
					"https://example.com/api/apps/app_1234567890123456/tasks/tsk_1234567890123456",
				);
				expect(init?.method).toBe("GET");
				expect(headers.get("Authorization")).toBe("Bearer gsk_test.secret");

				return new Response(
					JSON.stringify({
						task: { ...mockTaskBase, status: "completed" },
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			if (callIndex === 4) {
				expect(url).toBe(
					"https://example.com/api/apps/app_1234567890123456/tasks/tsk_1234567890123456?includeGenerations=1",
				);
				expect(init?.method).toBe("GET");
				expect(headers.get("Authorization")).toBe("Bearer gsk_test.secret");

				return new Response(
					JSON.stringify({
						task: { ...mockTaskBase, status: "completed" },
						generations: [],
					}),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			throw new Error(`Unexpected request: ${String(url)}`);
		});

		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "gsk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		const result = await client.app.runAndWait({
			appId: "app_1234567890123456",
			input: { text: "hello" },
			pollIntervalMs: 0,
		});

		expect(result.task).toMatchObject({
			id: "tsk_1234567890123456",
			status: "completed",
			workspaceId: "wrks_1234567890123456",
			name: "My Task",
			steps: [],
			outputs: [],
		});
	});

	it("app.runAndWait() times out if the task never completes", async () => {
		let callIndex = 0;
		const fetchMock = vi.fn((_url: unknown, _init?: RequestInit) => {
			callIndex += 1;
			if (callIndex === 1) {
				return new Response(
					JSON.stringify({ ...mockTaskBase, status: "created" }),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			return new Response(
				JSON.stringify({
					task: { ...mockTaskBase, status: "inProgress" },
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		});

		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "gsk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		// Force immediate timeout by setting a negative pollInterval and relying on default timeout window.
		// We can't easily time-travel Date.now() without mocking timers, so we just assert the error type
		// by making the fetch throw after a couple of polls.
		await expect(
			client.app.runAndWait({
				appId: "app_1234567890123456",
				input: { text: "hello" },
				pollIntervalMs: 0,
				timeoutMs: 0,
			}),
		).rejects.toBeInstanceOf(TimeoutError);
	});
});
