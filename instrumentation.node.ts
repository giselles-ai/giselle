import { logRecordProcessor, metricReader } from "@/lib/opentelemetry";
import { NoopSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { registerOTel } from "@vercel/otel";

registerOTel({
	serviceName: "giselle",
	spanProcessors: [new NoopSpanProcessor()],
	metricReader,
	logRecordProcessor,
});
console.log("-- OTEL registered with metrics, traces, and logs --");
