import {
	createBridgeSession,
	createGeminiChatHandler,
} from "@giselles-ai/sandbox-agent-core";
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
});

function mergeBridgeSessionStream(input: {
	chatResponse: Response;
	session: { sessionId: string; token: string; expiresAt: number };
	bridgeUrl: string;
}): Response {
	if (!input.chatResponse.body) {
		return input.chatResponse;
	}

	const encoder = new TextEncoder();
	const bridgeSessionEvent = `${JSON.stringify({
		type: "bridge.session",
		sessionId: input.session.sessionId,
		token: input.session.token,
		expiresAt: input.session.expiresAt,
		bridgeUrl: input.bridgeUrl,
	})}\n`;

	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(encoder.encode(bridgeSessionEvent));
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

	const session = await createBridgeSession();

	const trimmedDocument = parsed.data.document?.trim();
	const message = trimmedDocument
		? `${parsed.data.message.trim()}\n\nDocument:\n${trimmedDocument}`
		: parsed.data.message.trim();

	const chatHandler = createGeminiChatHandler();
	const chatHeaders = new Headers({ "content-type": "application/json" });
	const oidcToken = request.headers.get("x-vercel-oidc-token");
	if (oidcToken) {
		chatHeaders.set("x-vercel-oidc-token", oidcToken);
	}

	const chatRequest = new Request(request.url, {
		method: "POST",
		headers: chatHeaders,
		body: JSON.stringify({
			message,
			session_id: parsed.data.session_id,
			sandbox_id: parsed.data.sandbox_id,
			bridge_session_id: session.sessionId,
			bridge_token: session.token,
		}),
		signal: request.signal,
	});

	const chatResponse = await chatHandler(chatRequest);

	const requestUrl = new URL(request.url);
	const bridgeUrl = `${requestUrl.origin}/agent-api/bridge`;

	const response = mergeBridgeSessionStream({
		chatResponse,
		session,
		bridgeUrl,
	});

	for (const [key, value] of rateLimitHeaders.entries()) {
		response.headers.set(key, value);
	}

	return response;
}
