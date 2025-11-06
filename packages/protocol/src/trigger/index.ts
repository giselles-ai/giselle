import { createIdGenerator } from "@giselles-ai/utils";
import { z } from "zod/v4";
import { NodeId } from "../node/base";
import { WorkspaceId } from "../workspace/id";
import { GitHubFlowTrigger } from "./github";
import { ManualFlowTrigger } from "./manual";

export { GitHubFlowTrigger, GitHubFlowTriggerEvent } from "./github";
export {
	ManualFlowTrigger,
	ManualFlowTriggerEvent,
	ManualParameterType as ParameterType,
	ManualTriggerParameter,
	ManualTriggerParameterId,
} from "./manual";

export const TriggerId = createIdGenerator("fltg");
export type TriggerId = z.infer<typeof TriggerId.schema>;

export * from "./providers";

export const Trigger = z.object({
	id: TriggerId.schema,
	workspaceId: WorkspaceId.schema,
	nodeId: NodeId.schema,
	enable: z.boolean().default(true),
	configuration: z.discriminatedUnion("provider", [
		GitHubFlowTrigger,
		ManualFlowTrigger,
	]),
});
export type Trigger = z.infer<typeof Trigger>;

// Legacy aliases for backward compatibility
export const FlowTrigger = Trigger;
export type FlowTrigger = Trigger;
export const FlowTriggerId = TriggerId;
export type FlowTriggerId = TriggerId;

export * from "./github";
