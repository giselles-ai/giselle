import {
	logRecordProcessor,
	metricReader,
	noopSpanProcessor,
} from "@/lib/opentelemetry";
import { registerOTel } from "@vercel/otel";

registerOTel({
	serviceName: "giselle",
	spanProcessors: [noopSpanProcessor],
	metricReader,
	logRecordProcessor,
});
