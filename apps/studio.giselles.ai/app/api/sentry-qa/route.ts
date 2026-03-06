import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

export function GET() {
	try {
		throw new Error("Manual QA Sentry Server Test");
	} catch (error) {
		Sentry.captureException(error);
		return NextResponse.json({
			message: "Server error sent to Sentry. Check the Sentry dashboard.",
		});
	}
}
