import { createIdGenerator } from "@giselle-sdk/utils";
import type { z } from "zod";
export { GitHubFlowAction } from "./github";

export const FlowActionId = createIdGenerator("flac");
export type FlowActionId = z.infer<typeof FlowActionId.schema>;
