import {
	logRecordProcessor,
	metricReader,
	noopSpanProcessor,
} from "@/lib/opentelemetry";
import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

registerOTel({
	serviceName: "giselle",
	spanProcessors: [noopSpanProcessor],
	metricReader,
	logRecordProcessor,
	traceExporter: new LangfuseExporter({
		flushInterval: Number.parseInt(
			process.env.LANGFUSE_FLUSH_INTERVAL ?? "1000",
		),
	}),
});
