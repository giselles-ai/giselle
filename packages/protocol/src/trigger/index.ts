import { createIdGenerator } from "@giselles-ai/utils";
import { z } from "zod/v4";
import { NodeId } from "../node/base";
import { WorkspaceId } from "../workspace/id";
import { GitHubTrigger } from "./github";
import { ManualTrigger } from "./manual";

export {
	GitHubTrigger,
	GitHubTriggerEvent,
} from "./github";
export {
	ManualParameterType as ParameterType,
	ManualTrigger,
	ManualTriggerEvent,
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
		GitHubTrigger,
		ManualTrigger,
	]),
});
export type Trigger = z.infer<typeof Trigger>;

export * from "./github";
