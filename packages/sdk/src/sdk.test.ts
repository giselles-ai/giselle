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
			expect(headers.get("Authorization")).toBe("Bearer apk_test.secret");
			expect(headers.get("Content-Type")).toBe("application/json");
			expect(init?.body).toBe(JSON.stringify({ text: "hello" }));

			return new Response(JSON.stringify({ taskId: "tsk_123" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		});

		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "apk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		await expect(
			client.app.run({ appId: "app-xxxxx", input: { text: "hello" } }),
		).resolves.toEqual({ taskId: "tsk_123" });
	});

	it("app.run() sends file reference input.file={fileId}", async () => {
		const fetchMock = vi.fn((url: unknown, init?: RequestInit) => {
			expect(url).toBe("https://example.com/api/apps/app-xxxxx/run");
			expect(init?.method).toBe("POST");
			const headers = new Headers(init?.headers);
			expect(headers.get("Authorization")).toBe("Bearer apk_test.secret");
			expect(headers.get("Content-Type")).toBe("application/json");
			expect(init?.body).toBe(
				JSON.stringify({ text: "hello", file: { fileId: "fl_123" } }),
			);

			return new Response(JSON.stringify({ taskId: "tsk_123" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		});

		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "apk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		await expect(
			client.app.run({
				appId: "app-xxxxx",
				input: { text: "hello", file: { fileId: "fl_123" } },
			}),
		).resolves.toEqual({ taskId: "tsk_123" });
	});

	it("app.run() sends inline base64 file input", async () => {
		const fetchMock = vi.fn((url: unknown, init?: RequestInit) => {
			expect(url).toBe("https://example.com/api/apps/app-xxxxx/run");
			expect(init?.method).toBe("POST");
			const headers = new Headers(init?.headers);
			expect(headers.get("Authorization")).toBe("Bearer apk_test.secret");
			expect(headers.get("Content-Type")).toBe("application/json");
			expect(init?.body).toBe(
				JSON.stringify({
					text: "hello",
					file: {
						base64: "aGVsbG8=",
						name: "hello.txt",
						type: "text/plain",
					},
				}),
			);

			return new Response(JSON.stringify({ taskId: "tsk_123" }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		});

		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "apk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		await expect(
			client.app.run({
				appId: "app-xxxxx",
				input: {
					text: "hello",
					file: {
						base64: "aGVsbG8=",
						name: "hello.txt",
						type: "text/plain",
					},
				},
			}),
		).resolves.toEqual({ taskId: "tsk_123" });
	});

	it("app.run() rejects inline base64 file larger than 3MB (decoded)", async () => {
		const fetchMock = vi.fn();
		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "apk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		const maxDecodedBytes = 1024 * 1024 * 3;
		let len = Math.ceil(((maxDecodedBytes + 1) * 4) / 3);
		len += (4 - (len % 4)) % 4;
		const overLimitBase64 = "A".repeat(len);

		await expect(
			client.app.run({
				appId: "app-xxxxx",
				input: {
					text: "hello",
					file: {
						base64: overLimitBase64,
						name: "big.bin",
						type: "application/octet-stream",
					},
				},
			}),
		).rejects.toBeInstanceOf(UnsupportedFeatureError);
		expect(fetchMock).not.toHaveBeenCalled();
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
			apiKey: "apk_test.secret",
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

	it("app.runAndWait() polls task status and returns final task result", async () => {
		let callIndex = 0;
		const fetchMock = vi.fn((url: unknown, init?: RequestInit) => {
			callIndex += 1;
			const headers = new Headers(init?.headers);

			if (callIndex === 1) {
				expect(url).toBe("https://example.com/api/apps/app-xxxxx/run");
				expect(init?.method).toBe("POST");
				expect(headers.get("Authorization")).toBe("Bearer apk_test.secret");
				expect(headers.get("Content-Type")).toBe("application/json");
				expect(init?.body).toBe(JSON.stringify({ text: "hello" }));

				return new Response(JSON.stringify({ taskId: "tsk_123" }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			if (callIndex === 2) {
				expect(url).toBe(
					"https://example.com/api/apps/app-xxxxx/tasks/tsk_123",
				);
				expect(init?.method).toBe("GET");
				expect(headers.get("Authorization")).toBe("Bearer apk_test.secret");

				return new Response(
					JSON.stringify({ task: { id: "tsk_123", status: "inProgress" } }),
					{
						status: 200,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			if (callIndex === 3) {
				expect(url).toBe(
					"https://example.com/api/apps/app-xxxxx/tasks/tsk_123",
				);
				expect(init?.method).toBe("GET");
				expect(headers.get("Authorization")).toBe("Bearer apk_test.secret");

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
				expect(headers.get("Authorization")).toBe("Bearer apk_test.secret");

				return new Response(
					JSON.stringify({
						task: {
							id: "tsk_123",
							status: "completed",
							workspaceId: "ws_123",
							name: "My Task",
							steps: [],
							outputs: [],
						},
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
			apiKey: "apk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		await expect(
			client.app.runAndWait({
				appId: "app-xxxxx",
				input: { text: "hello" },
				pollIntervalMs: 0,
			}),
		).resolves.toEqual({
			task: {
				id: "tsk_123",
				status: "completed",
				workspaceId: "ws_123",
				name: "My Task",
				steps: [],
				outputs: [],
			},
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
			apiKey: "apk_test.secret",
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

	it("files.upload() calls POST /api/apps/{appId}/files/upload and returns UploadedFileData", async () => {
		const fetchMock = vi.fn((url: unknown, init?: RequestInit) => {
			expect(url).toBe("https://example.com/api/apps/app-xxxxx/files/upload");
			expect(init?.method).toBe("POST");
			const headers = new Headers(init?.headers);
			expect(headers.get("Authorization")).toBe("Bearer apk_test.secret");
			expect(headers.get("Content-Type")).toBeNull();

			expect(init?.body).toBeInstanceOf(FormData);
			const body = init?.body as FormData;
			expect(body.get("file")).toBeInstanceOf(File);
			expect(body.get("fileName")).toBe("custom-name.txt");

			return new Response(
				JSON.stringify({
					file: {
						id: "fl_123",
						name: "custom-name.txt",
						type: "text/plain",
						size: 5,
						status: "uploaded",
						uploadedAt: 1234567890,
					},
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			);
		});

		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "apk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		const file = new File(["hello"], "hello.txt", { type: "text/plain" });

		await expect(
			client.files.upload({
				appId: "app-xxxxx",
				file,
				fileName: "custom-name.txt",
			}),
		).resolves.toEqual({
			file: {
				id: "fl_123",
				name: "custom-name.txt",
				type: "text/plain",
				size: 5,
				status: "uploaded",
				uploadedAt: 1234567890,
			},
		});
	});

	it("apps.list() calls GET /api/apps and returns apps", async () => {
		const app = {
			id: "app-AAAAAAAAAAAAAAAA",
			version: "v1",
			state: "disconnected",
			description: "Demo app",
			parameters: [
				{
					id: "appprm-AAAAAAAAAAAAAAAA",
					name: "Input",
					type: "text",
					required: true,
				},
			],
			entryNodeId: "nd-AAAAAAAAAAAAAAAA",
			workspaceId: "wrks-AAAAAAAAAAAAAAAA",
		};
		const appName = "Demo workspace";
		const fetchMock = vi.fn((url: unknown, init?: RequestInit) => {
			expect(url).toBe("https://example.com/api/apps");
			expect(init?.method).toBe("GET");
			const headers = new Headers(init?.headers);
			expect(headers.get("Authorization")).toBe("Bearer apk_test.secret");

			return new Response(
				JSON.stringify({ apps: [{ ...app, workspaceName: appName }] }),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		});

		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "apk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		await expect(client.apps.list()).resolves.toEqual({
			apps: [{ ...app, name: appName }],
		});
	});

	it("apps.list() falls back to Untitled when name is missing", async () => {
		const app = {
			id: "app-BBBBBBBBBBBBBBBB",
			version: "v1",
			state: "disconnected",
			description: "Demo app",
			parameters: [
				{
					id: "appprm-BBBBBBBBBBBBBBBB",
					name: "Input",
					type: "text",
					required: true,
				},
			],
			entryNodeId: "nd-BBBBBBBBBBBBBBBB",
			workspaceId: "wrks-BBBBBBBBBBBBBBBB",
		};
		const fetchMock = vi.fn((url: unknown, init?: RequestInit) => {
			expect(url).toBe("https://example.com/api/apps");
			expect(init?.method).toBe("GET");
			const headers = new Headers(init?.headers);
			expect(headers.get("Authorization")).toBe("Bearer apk_test.secret");

			return new Response(JSON.stringify({ apps: [app] }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		});

		const client = new Giselle({
			baseUrl: "https://example.com",
			apiKey: "apk_test.secret",
			fetch: fetchMock as unknown as typeof fetch,
		});

		await expect(client.apps.list()).resolves.toEqual({
			apps: [{ ...app, name: "Untitled" }],
		});
	});

	it("apps.list() throws if apiKey is missing", async () => {
		const client = new Giselle({
			baseUrl: "https://example.com",
			fetch: vi.fn() as unknown as typeof fetch,
		});

		await expect(client.apps.list()).rejects.toBeInstanceOf(ConfigurationError);
	});
});
