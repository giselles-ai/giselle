import { describe, expect, it, vi } from "vitest";
import {
	ConfigurationError,
	TimeoutError,
	UnsupportedFeatureError,
} from "./errors";
import Giselle from "./sdk";

describe("Giselle SDK (public Runs API)", () => {
	it("app.run() calls POST /api/apps/{appId}/run and returns taskId", async () => {
		const fetchMock = vi.fn((url: unknown, init?: RequestInit) => {
			expect(url).toBe("https://example.com/api/apps/app-xxxxx/run");
			expect(init?.method).toBe("POST");
			const headersInit = init?.headers;
			const headers = new Headers(headersInit);
			expect(headers.get("Authorization")).toBe("Bearer gsk_test.secret");
			expect(headers.get("Content-Type")).toBe("application/json");
			expect(init?.body).toBe(JSON.stringify({ text: "hello" }));

			return new Response(JSON.stringify({ taskId: "tsk_123" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		});

		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "gsk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		await expect(
			client.app.run({ appId: "app-xxxxx", input: { text: "hello" } }),
		).resolves.toEqual({ taskId: "tsk_123" });
	});

	it("defaults baseUrl to https://studio.giselles.ai", async () => {
		const fetchMock = vi.fn((url: unknown) => {
			expect(url).toBe("https://studio.giselles.ai/api/apps/app-xxxxx/run");
			return Promise.resolve(
				new Response(JSON.stringify({ taskId: "tsk_123" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);
		});

		const client = new Giselle({
			apiKey: "gsk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		await expect(
			client.app.run({ appId: "app-xxxxx", input: { text: "hello" } }),
		).resolves.toEqual({ taskId: "tsk_123" });
	});

	it("app.run() throws if apiKey is missing", async () => {
		const client = new Giselle({
			baseUrl: "https://example.com",
			fetch: vi.fn() as unknown as typeof fetch,
		});

		await expect(
			client.app.run({ appId: "app-xxxxx", input: { text: "hello" } }),
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
				appId: "app-xxxxx",
				input: { text: "hello", file: "base64..." },
			}),
		).rejects.toBeInstanceOf(UnsupportedFeatureError);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("app.runAndWait() polls task status and returns final task + generations", async () => {
		let callIndex = 0;
		const fetchMock = vi.fn((url: unknown, init?: RequestInit) => {
			callIndex += 1;
			const headers = new Headers(init?.headers);

			if (callIndex === 1) {
				expect(url).toBe("https://example.com/api/apps/app-xxxxx/run");
				expect(init?.method).toBe("POST");
				expect(headers.get("Authorization")).toBe("Bearer gsk_test.secret");
				expect(headers.get("Content-Type")).toBe("application/json");
				expect(init?.body).toBe(JSON.stringify({ text: "hello" }));

				return new Response(JSON.stringify({ taskId: "tsk_123" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			if (callIndex === 2) {
				expect(url).toBe("https://example.com/api/apps/app-xxxxx/tasks/tsk_123");
				expect(init?.method).toBe("GET");
				expect(headers.get("Authorization")).toBe("Bearer gsk_test.secret");

				return new Response(
					JSON.stringify({ task: { id: "tsk_123", status: "inProgress" } }),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			if (callIndex === 3) {
				expect(url).toBe("https://example.com/api/apps/app-xxxxx/tasks/tsk_123");
				expect(init?.method).toBe("GET");
				expect(headers.get("Authorization")).toBe("Bearer gsk_test.secret");

				return new Response(
					JSON.stringify({ task: { id: "tsk_123", status: "completed" } }),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			if (callIndex === 4) {
				expect(url).toBe(
					"https://example.com/api/apps/app-xxxxx/tasks/tsk_123?includeGenerations=1",
				);
				expect(init?.method).toBe("GET");
				expect(headers.get("Authorization")).toBe("Bearer gsk_test.secret");

				return new Response(
					JSON.stringify({
						task: { id: "tsk_123", status: "completed" },
						generationsById: { gen_1: { id: "gen_1", status: "completed" } },
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

		await expect(
			client.app.runAndWait({
				appId: "app-xxxxx",
				input: { text: "hello" },
				pollIntervalMs: 0,
			}),
		).resolves.toEqual({
			task: { id: "tsk_123", status: "completed" },
			generationsById: { gen_1: { id: "gen_1", status: "completed" } },
		});
	});

	it("app.runAndWait() times out if the task never completes", async () => {
		let callIndex = 0;
		const fetchMock = vi.fn((_url: unknown, _init?: RequestInit) => {
			callIndex += 1;
			if (callIndex === 1) {
				return new Response(JSON.stringify({ taskId: "tsk_123" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			return new Response(
				JSON.stringify({ task: { id: "tsk_123", status: "inProgress" } }),
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
				appId: "app-xxxxx",
				input: { text: "hello" },
				pollIntervalMs: 0,
				timeoutMs: 0,
			}),
		).rejects.toBeInstanceOf(TimeoutError);
	});
});
