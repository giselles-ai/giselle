import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
	const error = new Error("Manual QA Sentry Server Test");
	Sentry.captureException(error);
	await Sentry.flush(2000);
	return NextResponse.json({
		message: "Server error sent to Sentry. Check the Sentry dashboard.",
	});
}
