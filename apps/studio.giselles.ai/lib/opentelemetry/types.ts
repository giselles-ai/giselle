import { z } from "zod";

const ExternalServiceName = {
	Anthropic: "anthropic",
	Google: "google",
	OpenAI: "openai",
	Tavily: "tavily",
	Unstructured: "unstructured",
} as const;

const UnimplementedServiceName = {
	Unknown: "unknown", // for type safety
};

const BaseMetricsSchema = z.object({
	duration: z.number().min(0), // Time taken for text generation in milliseconds
	measurementScope: z.number(), // ID of the plan usage contract to which the requester belongs
	isR06User: z.boolean(), // Whether the requester has internal user
});

const TokenBasedService = {
	Anthropic: ExternalServiceName.Anthropic,
	Google: ExternalServiceName.Google,
	OpenAI: ExternalServiceName.OpenAI,
} as const;

const TokenConsumedSchema = BaseMetricsSchema.extend({
	externalServiceName: z.union([
		z.enum(Object.values(TokenBasedService) as [string, ...string[]]),
		z.enum(Object.values(UnimplementedServiceName) as [string, ...string[]]),
	]),
	modelId: z.string(), // ID of the model used for text generation
	tokenConsumedInput: z.number(), // Number of tokens used in the prompt/input sent to the model
	tokenConsumedOutput: z.number(), // Number of tokens used in the response/output received from the model
});

const RequestCount = BaseMetricsSchema.extend({
	requestCount: z.number(), // Number of requests called
});

const BasicRequestCountSchema = RequestCount.extend({
	externalServiceName: z.enum([ExternalServiceName.Tavily]),
});

const RequestCountSchema = BasicRequestCountSchema;

type TokenConsumedSchema = z.infer<typeof TokenConsumedSchema>;
type RequestCountSchema = z.infer<typeof RequestCountSchema>;
type LogSchema = TokenConsumedSchema | RequestCountSchema;

export interface OtelLoggerWrapper {
	info: (obj: LogSchema, msg?: string) => void;
	error: (obj: LogSchema | Error, msg?: string) => void;
	debug: (obj: LogSchema, msg?: string) => void;
}
