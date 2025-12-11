import { createRequire } from "node:module";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import createBundleAnalyzer from "@next/bundle-analyzer";
import type { SentryBuildOptions } from "@sentry/nextjs";
import type { NextConfig } from "next";

const moduleRequire = createRequire(import.meta.url);
const projectDir = fileURLToPath(new URL(".", import.meta.url));

const pdfiumWasmPath = moduleRequire.resolve("@embedpdf/pdfium/pdfium.wasm");

export const serverExternalPackages = [
	"@embedpdf/pdfium",
	"pino",
	"pino-pretty",
	"happy-dom",
	"@supabase/supabase-js",
	"@supabase/realtime-js",
];
const pdfiumWasmInclude = relative(projectDir, pdfiumWasmPath).replace(
	/\\/g,
	"/",
);

const pdfiumTracingConfig = {
	outputFileTracingIncludes: {
		"/api/vector-stores/document/[documentVectorStoreId]/documents": [
			pdfiumWasmInclude,
		],
		"/api/vector-stores/cron/document/ingest": [pdfiumWasmInclude],
	},
};

const nextConfig: NextConfig = {
	serverExternalPackages,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "avatars.githubusercontent.com",
			},
			{
				protocol: "https",
				hostname: "lh3.googleusercontent.com",
			},
			...(process.env.NEXT_PUBLIC_SUPABASE_URL
				? [
						{
							protocol: "https" as const,
							hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
						},
					]
				: []),
		],
	},
	// biome-ignore lint/suspicious/useAwait: Next.js specification
	async redirects() {
		return [
			{
				source: "/",
				destination: "/workspaces",
				permanent: false,
			},
		];
	},
	// biome-ignore lint/suspicious/useAwait: Next.js specification
	async headers() {
		return [
			{
				source: "/:path*",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-DNS-Prefetch-Control",
						value: "on",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "origin-when-cross-origin",
					},
				],
			},
		];
	},
	experimental: {
		typedEnv: true,
		webpackMemoryOptimizations: true,
		webpackBuildWorker: true,
		serverComponentsExternalPackages: ["@embedpdf/pdfium"],
	},
	...pdfiumTracingConfig,
};

const sentryBuildOptions: SentryBuildOptions = {
	// For all available options, see:
	// https://www.npmjs.com/package/@sentry/webpack-plugin#options

	org: "route06cojp",
	project: "edge",

	// Only print logs for uploading source maps in CI
	silent: !process.env.CI,

	// For all available options, see:
	// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

	// Upload a larger set of source maps for prettier stack traces (increases build time)
	widenClientFileUpload: true,

	// Automatically annotate React components to show their full name in breadcrumbs and session replay
	reactComponentAnnotation: {
		enabled: true,
	},

	// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
	// This can increase your server load as well as your hosting bill.
	// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
	// side errors will fail.
	// Turn it off for now. Will reconsider if issues arise.
	// tunnelRoute: "/monitoring",

	// Hides source maps from generated client bundles
	sourcemaps: {
		deleteSourcemapsAfterUpload: true,
	},

	// Automatically tree-shake Sentry logger statements to reduce bundle size
	disableLogger: true,

	// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
	// See the following for more information:
	// https://docs.sentry.io/product/crons/
	// https://vercel.com/docs/cron-jobs
	automaticVercelMonitors: true,
};

const withAnalyzer = createBundleAnalyzer({
	enabled: process.env.ANALYZE === "true",
});
export default async function () {
	const enableSentry = process.env.VERCEL_ENV !== undefined;
	if (enableSentry) {
		return await import("@sentry/nextjs").then((mod) =>
			withAnalyzer(mod.withSentryConfig(nextConfig, sentryBuildOptions)),
		);
	}
	return withAnalyzer(nextConfig);
}
