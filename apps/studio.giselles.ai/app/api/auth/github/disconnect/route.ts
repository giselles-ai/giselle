import { disconnectIdentityApi } from "@/services/accounts";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const next = searchParams.get("next") || "/settings/account";

	try {
		const redirectPath = await disconnectIdentityApi("github", next);

		// Redirect to completion page on success
		const completeUrl = new URL("/auth/github/complete", request.url);
		completeUrl.searchParams.set("status", "success");
		completeUrl.searchParams.set(
			"message",
			"GitHub connection has been disconnected",
		);

		return NextResponse.redirect(completeUrl);
	} catch (error) {
		console.error("Error disconnecting GitHub identity:", error);
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		const completeUrl = new URL("/auth/github/complete", request.url);
		completeUrl.searchParams.set("status", "error");
		completeUrl.searchParams.set("message", errorMessage);

		return NextResponse.redirect(completeUrl);
	}
}
