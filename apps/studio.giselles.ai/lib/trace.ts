import { Langfuse } from "langfuse";
import { traceGeneration } from "@repo/langfuse/trace-generation";

const langfuse = new Langfuse({
	secretKey: process.env.LANGFUSE_SECRET_KEY,
	publicKey: process.env.LANGFUSE_PUBLIC_KEY,
	baseUrl: process.env.LANGFUSE_BASE_URL,
});

export const trace = ({
	traceId,
	userId,
	sessionId,
	metadata,
}: {
	traceId: string;
	userId?: string;
	sessionId?: string;
	metadata?: Record<string, unknown>;
}) => {
	return traceGeneration({
		langfuse,
		traceId,
		userId,
		sessionId,
		metadata,
		deploymentId: process.env.VERCEL_DEPLOYMENT_ID,
	});
};
