import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { headers } from "./base";

const metricExporter = new OTLPMetricExporter({
	url: "https://ingest.us.signoz.cloud:443/v1/metrics",
	headers,
});

export const metricReader = new PeriodicExportingMetricReader({
	exporter: metricExporter,
	exportIntervalMillis: 14000,
	exportTimeoutMillis: 5000,
});
