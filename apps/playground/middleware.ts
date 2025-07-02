import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_request: NextRequest) {
	if (process.env.VERCEL_ENV === "production") {
		return new NextResponse(null, { status: 404 });
	}
	return NextResponse.next();
}
