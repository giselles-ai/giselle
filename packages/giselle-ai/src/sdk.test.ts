import { describe, expect, it, vi } from "vitest";
import {
	ConfigurationError,
	NotImplementedError,
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

	it("app.runAndWait() is stubbed until the public status API exists", async () => {
		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "gsk_test.secret",
			fetch: vi.fn() as unknown as typeof fetch,
		});

		await expect(
			client.app.runAndWait({ appId: "app-xxxxx", input: { text: "hello" } }),
		).rejects.toBeInstanceOf(NotImplementedError);
	});
});
