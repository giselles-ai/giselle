import type { RunningGeneration } from "@giselles-ai/protocol";
import type { GenerationMetadata } from "../generations";

export interface AiGatewayContext {
	httpReferer: string;
	xTitle: string;
	stripeCustomerId?: string;
}

export interface BuildAiGatewayContextArgs {
	generation: RunningGeneration;
	metadata?: GenerationMetadata;
}

export type BuildAiGatewayContext = (
	args: BuildAiGatewayContextArgs,
) => Promise<AiGatewayContext | undefined> | AiGatewayContext | undefined;
