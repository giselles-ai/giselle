import { createRelaySession } from "@giselles-ai/browser-tool/relay";
import {
	createCodexAgent,
	createGeminiAgent,
	runChat,
} from "@giselles-ai/sandbox-agent";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import * as z from "zod/v4";
import { db } from "@/db";
import { teams } from "@/db/schema";
import { verifyApiSecret } from "@/lib/api-keys";
import {
	buildRateLimitHeaders,
	consumeTeamRateLimit,
} from "../../api/_lib/rate-limit";

const requestSchema = z.object({
	message: z.string().min(1),
	document: z.string().optional(),
	session_id: z.string().min(1).optional(),
	sandbox_id: z.string().min(1).optional(),
	agent_type: z.enum(["gemini", "codex"]),
});

function mergeRelaySessionStream(input: {
	chatResponse: Response;
	session: { sessionId: string; token: string; expiresAt: number };
	relayUrl: string;
}): Response {
	if (!input.chatResponse.body) {
		return input.chatResponse;
	}

	const encoder = new TextEncoder();
	const relaySessionEvent = `${JSON.stringify({
		type: "relay.session",
		sessionId: input.session.sessionId,
		token: input.session.token,
		expiresAt: input.session.expiresAt,
		relayUrl: input.relayUrl,
	})}\n`;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(encoder.encode(relaySessionEvent));
			const reader = input.chatResponse.body?.getReader();
			if (!reader) {
				controller.close();
				return;
			}

			void (async () => {
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) {
							break;
						}
						controller.enqueue(value);
					}
					controller.close();
				} catch (error) {
					controller.error(error);
				} finally {
					reader.releaseLock();
				}
			})();
		},
	});

	const headers = new Headers(input.chatResponse.headers);
	headers.set("Content-Type", "application/x-ndjson; charset=utf-8");
	headers.set("Cache-Control", "no-cache, no-transform");

	return new Response(stream, {
		status: input.chatResponse.status,
		statusText: input.chatResponse.statusText,
		headers,
	});
}

export async function POST(request: NextRequest) {
	const verifyResult = await verifyApiSecret({
		authorizationHeader: request.headers.get("authorization"),
	});
	if (!verifyResult.ok) {
		return new Response("Unauthorized", { status: 401 });
	}

	const [teamRecord] = await db
		.select({ plan: teams.plan })
		.from(teams)
		.where(eq(teams.dbId, verifyResult.teamDbId))
		.limit(1);

	if (!teamRecord) {
		return new Response("Unauthorized", { status: 401 });
	}

	const rateLimit = await consumeTeamRateLimit({
		teamDbId: verifyResult.teamDbId,
		plan: teamRecord.plan,
		routeKey: "agent_api_run",
		now: new Date(),
	});

	const rateLimitHeaders = buildRateLimitHeaders({
		limit: rateLimit.limit,
		remaining: rateLimit.remaining,
		resetAt: rateLimit.resetAt,
		retryAfterSeconds: rateLimit.allowed
			? undefined
			: rateLimit.retryAfterSeconds,
	});

	if (!rateLimit.allowed) {
		return new Response("Rate limit exceeded", {
			status: 429,
			headers: rateLimitHeaders,
		});
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response("Invalid JSON body", {
			status: 400,
			headers: rateLimitHeaders,
		});
	}

	const parsed = requestSchema.safeParse(body);
	if (!parsed.success) {
		return new Response("Invalid request body", {
			status: 400,
			headers: rateLimitHeaders,
		});
	}

	const requestUrl = new URL(request.url);
	const relayUrl = `${requestUrl.origin}/agent-api/relay`;

	const session = await createRelaySession();

	const trimmedDocument = parsed.data.document?.trim();
	const message = trimmedDocument
		? `${parsed.data.message.trim()}\n\nDocument:\n${trimmedDocument}`
		: parsed.data.message.trim();

	const oidcToken = request.headers.get("x-vercel-oidc-token");

	const agentType = parsed.data.agent_type;

	const commonEnv = {
		SANDBOX_SNAPSHOT_ID: process.env.SANDBOX_SNAPSHOT_ID ?? "",
		...(oidcToken ? { VERCEL_OIDC_TOKEN: oidcToken } : {}),
		...(process.env.VERCEL_PROTECTION_BYPASS
			? { VERCEL_PROTECTION_BYPASS: process.env.VERCEL_PROTECTION_BYPASS }
			: {}),
	};

	const browserEnv = {
		BROWSER_TOOL_RELAY_URL: relayUrl,
		BROWSER_TOOL_RELAY_SESSION_ID: session.sessionId,
		BROWSER_TOOL_RELAY_TOKEN: session.token,
	};

	const browserInput = {
		relay_session_id: session.sessionId,
		relay_token: session.token,
	};

	const chatResponse =
		agentType === "codex"
			? await runChat({
					agent: createCodexAgent({
						env: {
							OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
							...browserEnv,
							...commonEnv,
						},
						tools: {
							browser: { relayUrl },
						},
					}),
					signal: request.signal,
					input: {
						message,
						session_id: parsed.data.session_id,
						sandbox_id: parsed.data.sandbox_id,
						...browserInput,
					},
				})
			: await runChat({
					agent: createGeminiAgent({
						env: {
							GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
							...browserEnv,
							...commonEnv,
						},
						tools: {
							browser: { relayUrl },
						},
					}),
					signal: request.signal,
					input: {
						message,
						session_id: parsed.data.session_id,
						sandbox_id: parsed.data.sandbox_id,
						...browserInput,
					},
				});

	const response = mergeRelaySessionStream({
		chatResponse,
		session,
		relayUrl,
	});

	for (const [key, value] of rateLimitHeaders.entries()) {
		response.headers.set(key, value);
	}

	return response;
}
