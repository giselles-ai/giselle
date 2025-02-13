import type { WorkflowEngineContext } from "../types";

export type WorkflowEngineHandlerArgs<TInput = void> = {
	context: WorkflowEngineContext;
} & (TInput extends void ? Record<never, never> : { unsafeInput: unknown });
