import { NextRequest, type NextResponse } from "next/server";
import { afterEach, expect, test, vi } from "vitest";
import { proxy } from "./proxy";

vi.mock("./lib/supabase", () => ({
	supabaseMiddleware:
		(
			handler: (
				user: null,
				request: NextRequest,
			) => Promise<NextResponse | undefined>,
		) =>
		(request: NextRequest) =>
			handler(null, request),
}));

afterEach(() => vi.unstubAllEnvs());

test("rewrites to maintenance without an Edge Config connection", async () => {
	vi.stubEnv("EDGE_CONFIG", undefined);
	vi.stubEnv("MAINTENANCE_MODE", "true");
	const response = await proxy(new NextRequest("http://localhost:3000/apps"));
	expect(response?.headers.get("x-middleware-rewrite")).toBe(
		"http://localhost:3000/maintenance",
	);
});

test.each([undefined, "false", "", "0"])(
	"preserves the login redirect when maintenance is %s",
	async (value) => {
		vi.stubEnv("EDGE_CONFIG", undefined);
		vi.stubEnv("MAINTENANCE_MODE", value);
		const response = await proxy(
			new NextRequest("http://localhost:3000/apps?sort=recent"),
		);
		const location = new URL(response?.headers.get("location") ?? "");
		expect(location.pathname).toBe("/login");
		expect(location.searchParams.get("returnUrl")).toBe("/apps?sort=recent");
		expect(response?.headers.get("x-middleware-rewrite")).toBeNull();
	},
);
