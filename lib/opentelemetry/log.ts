import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import {
	BatchLogRecordProcessor,
	ConsoleLogRecordExporter,
	LoggerProvider,
} from "@opentelemetry/sdk-logs";
import { headers } from "./base";

const logExporter = new OTLPLogExporter({
	url: "https://ingest.us.signoz.cloud:443/v1/logs",
	headers,
});

export const logRecordProcessor = new BatchLogRecordProcessor(logExporter);

const loggerProvider = new LoggerProvider();
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));
loggerProvider.addLogRecordProcessor(
	new BatchLogRecordProcessor(new ConsoleLogRecordExporter()),
);

export const logger = loggerProvider.getLogger("giselles");
