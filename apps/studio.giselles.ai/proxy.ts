import { get } from "@vercel/edge-config";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseMiddleware } from "./lib/supabase";

// Paths that continue to serve traffic during `partial` maintenance: webhook
// receivers, auth flows, public marketing pages, and internal APIs. They also
// bypass the normal login redirect.
const PARTIAL_MAINTENANCE_BYPASS_PREFIXES = [
	"/webhooks",
	"/legal",
	"/login",
	"/signup",
	"/join",
	"/pricing",
	"/password_reset",
	"/auth",
	"/api/vector-stores/cron",
	"/api/apps",
	"/agent-api",
];

function isPartialMaintenanceBypassed(pathname: string): boolean {
	return PARTIAL_MAINTENANCE_BYPASS_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

type MaintenanceMode = "partial" | "full";

function parseMaintenanceMode(value: unknown): MaintenanceMode | undefined {
	if (value === "full" || value === "partial") {
		return value;
	}
	return undefined;
}

function rewriteToMaintenance(request: NextRequest) {
	request.nextUrl.pathname = "/maintenance";
	return NextResponse.rewrite(request.nextUrl);
}

export const proxy = async (request: NextRequest) => {
	const maintenance = parseMaintenanceMode(await get("maintenance"));

	if (maintenance === "full") {
		return rewriteToMaintenance(request);
	}

	const bypassed = isPartialMaintenanceBypassed(request.nextUrl.pathname);

	if (maintenance === "partial" && !bypassed) {
		return rewriteToMaintenance(request);
	}

	if (bypassed) {
		return NextResponse.next();
	}

	return supabaseMiddleware((user, req) => {
		if (user == null) {
			const url = req.nextUrl.clone();
			const returnUrl = req.nextUrl.pathname + req.nextUrl.search;
			url.pathname = "/login";
			url.searchParams.set("returnUrl", returnUrl);
			return NextResponse.redirect(url);
		}
	})(request);
};

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|.well-known|robots\\.txt|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
