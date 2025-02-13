import { getCurrentMeasurementScope, isRoute06User } from "@/app/(auth)/lib";
import { db } from "@/drizzle";
import type { AgentId } from "@giselles-ai/types";
import { waitUntil } from "@vercel/functions";
import type { LanguageModelUsage, LanguageModelV1 } from "ai";
import type { Strategy } from "unstructured-client/sdk/models/shared";
import { captureError } from "./log";
import type { LogSchema, OtelLoggerWrapper } from "./types";
import {
	ExternalServiceName,
	type RequestCountSchema,
	type TokenBasedServiceName,
	type TokenConsumedSchema,
	UnimplementedServiceName,
} from "./types";

type ModelInfo = {
	externalServiceName: TokenBasedServiceName;
	modelId: string;
};

interface ModelConfig extends LanguageModelV1 {
	modelId: string;
	config: {
		provider: string;
	};
}

function getModelInfo(
	logger: OtelLoggerWrapper,
	modelConfiguration: ModelConfig,
): ModelInfo {
	const [provider, _subtype] = modelConfiguration.config.provider.split(".");
	const modelId = modelConfiguration.modelId;

	switch (provider) {
		case "openai":
			return {
				externalServiceName: ExternalServiceName.OpenAI,
				modelId,
			};
		case "anthropic":
			return {
				externalServiceName: ExternalServiceName.Anthropic,
				modelId,
			};
		case "google":
			return {
				externalServiceName: ExternalServiceName.Google,
				modelId,
			};
		default:
			logger.error(
				new Error(`unknown provider '${provider}' passed`),
				"consider adding to 'ExternalServiceName'",
			);
			return {
				externalServiceName: UnimplementedServiceName.Unknown,
				modelId: "unknown",
			};
	}
}

type MeasurementSchema<T> = (result: T, duration: number) => LogSchema;

async function withMeasurement<T>(
	logger: OtelLoggerWrapper,
	operation: () => Promise<T>,
	measurement: MeasurementSchema<T>,
	measurementStartTime?: number,
): Promise<T> {
	const startTime = measurementStartTime ?? Date.now(); // set `startTime` for each call in parallel process
	try {
		// business logic: error should be thrown
		const result = await operation();

		try {
			// instrumentation: error must not be thrown to avoid interfering with the business logic
			const duration = Date.now() - startTime;
			const metrics = measurement(result, duration);
			logger.info(
				metrics,
				`[${metrics.externalServiceName}] response obtained`,
			);
		} catch (instrumentationError) {
			captureError(logger, instrumentationError, "instrumentation failed");
		}
		return result;
	} catch (error) {
		captureError(logger, error, "operation failed");
		throw error;
	}
}

const APICallBasedService = {
	Unstructured: ExternalServiceName.Unstructured,
	VercelBlob: ExternalServiceName.VercelBlob,
	Tavily: ExternalServiceName.Tavily,
	Firecrawl: ExternalServiceName.Firecrawl,
} as const;

export const VercelBlobOperation = {
	Copy: {
		type: "copy" as const,
		measure: (result: { size: number }) => ({
			blobSizeStored: result.size,
		}),
	},
	Put: {
		type: "put" as const,
		measure: (result: { size: number }) => ({
			blobSizeStored: result.size,
		}),
	},
	Fetch: {
		type: "fetch" as const,
		measure: (result: { size: number }) => ({
			blobSizeTransfered: result.size,
		}),
	},
	Del: {
		type: "del" as const,
		measure: (result: { size: number }) => ({
			blobSizeStored: -result.size,
		}),
	},
	List: {
		type: "list" as const,
		measure: (result: { size: number }) => ({
			blobSizeTransfered: result.size,
		}),
	},
} as const;

type VercelBlobOperationType =
	(typeof VercelBlobOperation)[keyof typeof VercelBlobOperation];

export function withCountMeasurement<T>(
	logger: OtelLoggerWrapper,
	operation: () => Promise<T>,
	externalServiceName: typeof APICallBasedService.Unstructured,
	measurementStartTime: number | undefined,
	strategy: Strategy,
): Promise<T>;
export function withCountMeasurement<T>(
	logger: OtelLoggerWrapper,
	operation: () => Promise<T>,
	externalServiceName: typeof APICallBasedService.VercelBlob,
	measurementStartTime: number | undefined,
	blobOperation: VercelBlobOperationType,
): Promise<T>;
export function withCountMeasurement<T>(
	logger: OtelLoggerWrapper,
	operation: () => Promise<T>,
	externalServiceName:
		| typeof APICallBasedService.Tavily
		| typeof APICallBasedService.Firecrawl,
	measurementStartTime?: number,
): Promise<T>;
export async function withCountMeasurement<T>(
	logger: OtelLoggerWrapper,
	operation: () => Promise<T>,
	externalServiceName: (typeof APICallBasedService)[keyof typeof APICallBasedService],
	measurementStartTime?: number,
	strategyOrOptions?: Strategy | VercelBlobOperationType | undefined,
): Promise<T> {
	const isR06User = await isRoute06User();
	const measurementScope = await getCurrentMeasurementScope();
	const measurement: MeasurementSchema<T> = (
		result,
		duration,
	): RequestCountSchema => {
		const baseMetrics = {
			duration,
			measurementScope,
			isR06User,
			requestCount: 1,
		};

		if (externalServiceName === APICallBasedService.Unstructured) {
			if (!strategyOrOptions) {
				logger.error(
					new Error("'strategy' is required for Unstructured service"),
					"missing required strategy parameter",
				);
			}
			return {
				...baseMetrics,
				externalServiceName,
				strategy: strategyOrOptions as Strategy,
			};
		}

		if (externalServiceName === APICallBasedService.VercelBlob) {
			const operation = strategyOrOptions as VercelBlobOperationType;
			const operationResult = operation.measure(result as { size: number });
			return {
				...baseMetrics,
				externalServiceName,
				operationType: operation.type,
				...operationResult,
			} as RequestCountSchema;
		}

		return {
			...baseMetrics,
			externalServiceName,
		};
	};

	return withMeasurement(logger, operation, measurement, measurementStartTime);
}

export async function withTokenMeasurement<
	T extends { usage: LanguageModelUsage },
>(
	logger: OtelLoggerWrapper,
	operation: () => Promise<T>,
	model: LanguageModelV1,
	agentId: AgentId,
	measurementStartTime?: number,
): Promise<T> {
	const { externalServiceName, modelId } = getModelInfo(
		logger,
		model as ModelConfig,
	);
	const agent = await db.query.agents.findFirst({
		columns: {
			teamDbId: true,
		},
		with: {
			team: {
				columns: {
					type: true,
				},
			},
		},
	});
	if (agent === undefined) {
		throw new Error("Agent not found");
	}
	const measurements: MeasurementSchema<T> = (
		result,
		duration,
	): TokenConsumedSchema => ({
		externalServiceName,
		modelId,
		tokenConsumedInput: result.usage.promptTokens,
		tokenConsumedOutput: result.usage.completionTokens,
		duration,
		measurementScope: agent.teamDbId,
		isR06User: agent.team.type === "internal",
	});

	return withMeasurement(logger, operation, measurements, measurementStartTime);
}

export function waitForTelemetryExport() {
	waitUntil(
		new Promise((resolve) =>
			setTimeout(
				resolve,
				Number.parseInt(process.env.OTEL_EXPORT_INTERVAL_MILLIS ?? "1000") +
					Number.parseInt(process.env.WAITUNTIL_OFFSET_MILLIS ?? "0"),
			),
		),
	);
}
