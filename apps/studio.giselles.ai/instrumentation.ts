import * as Sentry from "@sentry/nextjs";

export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("./instrumentation.node");
		await import("./sentry.server.config");
	}

	if (process.env.NEXT_RUNTIME === "edge") {
		await import("./sentry.edge.config");
	}

	process.env.LANGFUSE_TRACING_ENVIRONMENT =
		process.env.VERCEL_ENV || "development";
}
export const onRequestError = Sentry.captureRequestError;
