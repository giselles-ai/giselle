import { type ApiData, verifyAccess } from "flags";
import { getProviderData } from "flags/next";
import { type NextRequest, NextResponse } from "next/server";
import * as flags from "../../../../flags";

export const runtime = "edge";
export const dynamic = "force-dynamic"; // defaults to auto

export async function GET(request: NextRequest) {
	const access = await verifyAccess(request.headers.get("Authorization"));
	if (!access) return NextResponse.json(null, { status: 401 });

	return NextResponse.json<ApiData>(getProviderData(flags));
}
