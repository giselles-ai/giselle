import { describe, expect, it } from "vitest";
import {
	buildRateLimitHeaders,
	getRequestsPerMinuteLimit,
	getWindowResetAt,
	getWindowStart,
} from "./rate-limit";

describe("rate limit helpers", () => {
	it("maps plan to req/min limits", () => {
		expect(getRequestsPerMinuteLimit("free")).toBe(60);
		expect(getRequestsPerMinuteLimit("pro")).toBe(300);
		expect(getRequestsPerMinuteLimit("team")).toBe(600);
		expect(getRequestsPerMinuteLimit("enterprise")).toBe(3000);
		expect(getRequestsPerMinuteLimit("internal")).toBeGreaterThan(3000);
	});

	it("computes a fixed 60s window start/reset", () => {
		const now = new Date("2026-01-06T12:34:56.789Z");
		const windowStart = getWindowStart(now);
		const resetAt = getWindowResetAt(windowStart);

		expect(windowStart.toISOString()).toBe("2026-01-06T12:34:00.000Z");
		expect(resetAt.toISOString()).toBe("2026-01-06T12:35:00.000Z");
	});

	it("builds RateLimit headers", () => {
		const resetAt = new Date("2026-01-06T12:35:00.000Z");
		const headers = buildRateLimitHeaders({
			limit: 60,
			remaining: 12,
			resetAt,
			retryAfterSeconds: 30,
		});

		expect(headers.get("RateLimit-Limit")).toBe("60");
		expect(headers.get("RateLimit-Remaining")).toBe("12");
		expect(headers.get("RateLimit-Reset")).toBe(
			String(Math.floor(resetAt.getTime() / 1000)),
		);
		expect(headers.get("Retry-After")).toBe("30");
	});
});
