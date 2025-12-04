import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
	const error = new Error("Sentry server-side test error");
	Sentry.captureException(error);
	await Sentry.flush(2000);
	return NextResponse.json({
		message: "Server-side error sent to Sentry",
		timestamp: new Date().toISOString(),
	});
}

export function POST() {
	throw new Error("Sentry server-side unhandled error test");
}
