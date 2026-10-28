export function register() {
	process.env.LANGFUSE_TRACING_ENVIRONMENT =
		process.env.VERCEL_ENV || "development";
}
