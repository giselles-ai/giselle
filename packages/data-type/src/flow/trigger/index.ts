import { createIdGenerator } from "@giselle-sdk/utils";
import type { z } from "zod/v4";

export {
	GitHubFlowTrigger,
	GitHubFlowTriggerEvent,
} from "./github";
export {
	ManualFlowTrigger,
	ManualFlowTriggerEvent,
	ManualParameterType as ParameterType,
	ManualTriggerParameter,
	ManualTriggerParameterId,
} from "./manual";

export const FlowTriggerId = createIdGenerator("fltg");
export type FlowTriggerId = z.infer<typeof FlowTriggerId.schema>;
