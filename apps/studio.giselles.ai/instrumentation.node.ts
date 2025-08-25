import { registerOTel } from "@vercel/otel";
import { LangfuseExporter } from "langfuse-vercel";

/**
 * @link https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/#batch-span-processor
 */
const otelBspScheduleDelayDefault = 5000;
const OTEL_BSP_SCHEDULE_DELAY =
	Number(process.env.OTEL_BSP_SCHEDULE_DELAY) || otelBspScheduleDelayDefault;
const LANGFUSE_FLUSH_INTERVAL = 1000;

export const waitForLangfuseFlush = () =>
	new Promise((resolve) =>
		setTimeout(resolve, OTEL_BSP_SCHEDULE_DELAY + LANGFUSE_FLUSH_INTERVAL),
	);

registerOTel({
	serviceName: "giselle",
	traceExporter: new LangfuseExporter({
		flushInterval: LANGFUSE_FLUSH_INTERVAL,
	}),
});
