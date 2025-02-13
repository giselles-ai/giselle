import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { headers } from "./base";

const metricExporter = new OTLPMetricExporter({
	url: "https://ingest.us.signoz.cloud:443/v1/metrics",
	headers,
});

const exportIntervalMillis = Number.parseInt(
	process.env.OTEL_EXPORT_INTERVAL_MILLIS ?? "1000",
);

export const metricReader = new PeriodicExportingMetricReader({
	exporter: metricExporter,
	exportIntervalMillis,
	exportTimeoutMillis: exportIntervalMillis - 100, // retries exporting if timeout
});
