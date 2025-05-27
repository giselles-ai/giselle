import { createIdGeneratorV4 as createIdGenerator } from "@giselle-sdk/utils";
import type { z } from "zod/v4";
export { GitHubFlowTrigger, GitHubFlowTriggerEvent } from "./github";
export {
	ManualTriggerParameterId,
	ManualFlowTrigger,
	ManualFlowTriggerEvent,
	ManualTriggerParameter,
	ManualParameterType as ParameterType,
} from "./manual";

export const FlowTriggerId = createIdGenerator("fltg");
export type FlowTriggerId = z.infer<typeof FlowTriggerId.schema>;
