import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { TeamPlan } from "@/db/schema";
import { apiRateLimitCounters } from "@/db/schema";

type RateLimitResult = {
	allowed: boolean;
	limit: number;
	remaining: number;
	resetAt: Date;
	retryAfterSeconds: number;
};

const WINDOW_SECONDS = 60;

export function getRequestsPerMinuteLimit(plan: TeamPlan): number {
	switch (plan) {
		case "free":
			return 60;
		case "pro":
			return 300;
		case "team":
			return 600;
		case "enterprise":
			return 3000;
		case "internal":
			return 1_000_000;
		default: {
			const _exhaustiveCheck: never = plan;
			return _exhaustiveCheck;
		}
	}
}

export function getWindowStart(now: Date): Date {
	return new Date(Math.floor(now.getTime() / (WINDOW_SECONDS * 1000)) * 60_000);
}

export function getWindowResetAt(windowStart: Date): Date {
	return new Date(windowStart.getTime() + WINDOW_SECONDS * 1000);
}

export function buildRateLimitHeaders(args: {
	limit: number;
	remaining: number;
	resetAt: Date;
	retryAfterSeconds?: number;
}): Headers {
	const headers = new Headers();

	headers.set("RateLimit-Limit", String(args.limit));
	headers.set("RateLimit-Remaining", String(Math.max(0, args.remaining)));
	headers.set(
		"RateLimit-Reset",
		String(Math.floor(args.resetAt.getTime() / 1000)),
	);
	if (args.retryAfterSeconds !== undefined) {
		headers.set(
			"Retry-After",
			String(Math.max(0, Math.floor(args.retryAfterSeconds))),
		);
	}

	return headers;
}

export async function consumeTeamRateLimit(args: {
	teamDbId: number;
	plan: TeamPlan;
	routeKey: string;
	now: Date;
}): Promise<RateLimitResult> {
	const limit = getRequestsPerMinuteLimit(args.plan);
	const windowStart = getWindowStart(args.now);
	const resetAt = getWindowResetAt(windowStart);

	const windowStartIso = windowStart.toISOString();
	const teamDbId = args.teamDbId;
	const routeKey = args.routeKey;

	const [record] = await db
		.insert(apiRateLimitCounters)
		.values({
			teamDbId,
			routeKey,
			windowStart,
			count: 1,
		})
		.onConflictDoUpdate({
			target: [
				apiRateLimitCounters.teamDbId,
				apiRateLimitCounters.routeKey,
				apiRateLimitCounters.windowStart,
			],
			set: {
				count: sql`${apiRateLimitCounters.count} + 1`,
				updatedAt: new Date(),
			},
		})
		.returning({
			count: apiRateLimitCounters.count,
		});

	if (!record) {
		throw new Error(
			`Failed to consume rate limit (teamDbId=${teamDbId}, routeKey=${routeKey}, windowStart=${windowStartIso})`,
		);
	}

	const used = record.count;
	const remaining = Math.max(0, limit - used);
	const allowed = used <= limit;
	const retryAfterSeconds = Math.max(
		0,
		Math.ceil((resetAt.getTime() - args.now.getTime()) / 1000),
	);

	return {
		allowed,
		limit,
		remaining,
		resetAt,
		retryAfterSeconds,
	};
}
