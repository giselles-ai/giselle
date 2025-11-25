import type { RunningGeneration } from "@giselles-ai/protocol";
import type { GenerationMetadata } from "../generations";

export type AiGatewayHeaders = {
	"http-referer": string;
	"x-title": string;
} & Record<string, string>;

export interface BuildAiGatewayHeadersArgs {
	generation: RunningGeneration;
	metadata?: GenerationMetadata;
}

export type BuildAiGatewayHeaders = (
	args: BuildAiGatewayHeadersArgs,
) => Promise<AiGatewayHeaders | undefined> | AiGatewayHeaders | undefined;
