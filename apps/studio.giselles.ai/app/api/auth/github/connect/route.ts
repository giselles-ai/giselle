import { connectIdentityApi } from "@/services/accounts";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const next = searchParams.get("next") || "/settings/account";

	try {
		const url = await connectIdentityApi("github", next);
		return NextResponse.redirect(url);
	} catch (error) {
		console.error("Error connecting GitHub identity:", error);
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred";
		const completeUrl = new URL("/auth/github/complete", request.url);
		completeUrl.searchParams.set("status", "error");
		completeUrl.searchParams.set("message", errorMessage);

		return NextResponse.redirect(completeUrl);
	}
}
