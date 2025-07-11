import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";

import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";

import { captureException } from "@sentry/nextjs";
import { headers } from "./base";
import type { OtelLoggerWrapper } from "./types";

const logExporter = new OTLPLogExporter({
	url: "https://ingest.us.signoz.cloud:443/v1/logs",
	headers,
});

export const logRecordProcessor = new BatchLogRecordProcessor(logExporter);

export const captureError = (
	logger: OtelLoggerWrapper,
	error: unknown,
	message: string,
) => {
	if (error instanceof Error) {
		logger.error(error, message);
	} else {
		logger.error(new Error("Unknown error occurred"), message);
	}
	captureException(error);
};
