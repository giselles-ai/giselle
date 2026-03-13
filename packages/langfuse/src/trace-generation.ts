import { Langfuse } from "langfuse";
import type { LangfuseTraceClient } from "langfuse";

export type TraceGenerationParams = {
	langfuse: Langfuse;
	traceId: string;
	userId?: string;
	sessionId?: string;
	metadata?: Record<string, unknown>;
	deploymentId?: string;
};

export const traceGeneration = ({
	langfuse,
	traceId,
	userId,
	sessionId,
	metadata,
	deploymentId,
}: TraceGenerationParams): LangfuseTraceClient => {
	const trace = langfuse.trace({
		id: traceId,
		userId,
		sessionId,
		metadata: {
			...metadata,
			...(deploymentId ? { deploymentId } : {}),
		},
	});

	return trace;
};
