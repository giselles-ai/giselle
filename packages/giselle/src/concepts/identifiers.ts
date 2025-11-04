import { createIdGenerator } from "@giselle-ai/utils";
import type { z } from "zod/v4";

// ID generators that are shared between multiple modules
// These are extracted here to avoid circular dependencies

export const ActId = createIdGenerator("act");
export type ActId = z.infer<typeof ActId.schema>;

export const StepId = createIdGenerator("stp");
export type StepId = z.infer<typeof StepId.schema>;

export const GenerationId = createIdGenerator("gnr");
export type GenerationId = z.infer<typeof GenerationId.schema>;

export const AppId = createIdGenerator("app");
export type AppId = z.infer<typeof AppId.schema>;
