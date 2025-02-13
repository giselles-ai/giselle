import type { NextRequest } from "next/server";
import { WorkflowEngine, type WorkflowEngineConfig } from "../core";

type AppRouteHandlers = Record<
	"GET" | "POST",
	(req: NextRequest) => Promise<Response>
>;

interface NextWorkflowEngineConfig extends WorkflowEngineConfig {}
interface NextWokrflowEngineResult {
	handlers: AppRouteHandlers;
}

export function NextWorkflowEngine(
	config: NextWorkflowEngineConfig,
): NextWokrflowEngineResult {
	const httpHandler = (req: NextRequest) => WorkflowEngine(req, config);
	return {
		handlers: {
			GET: httpHandler,
			POST: httpHandler,
		},
	};
}
