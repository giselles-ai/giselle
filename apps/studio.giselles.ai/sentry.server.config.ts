// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
	dsn: "https://31ef4d348c8e420af1d1d8dcec3ab19e@o544600.ingest.us.sentry.io/4507535341387776",

	// Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
	tracesSampleRate: 1,

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: false,
	enabled: process.env.NEXT_PUBLIC_VERCEL_ENV !== undefined,
	skipOpenTelemetrySetup: true,
});
