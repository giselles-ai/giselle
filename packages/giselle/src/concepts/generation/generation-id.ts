import { createIdGenerator } from "@giselles-ai/utils";
import type z from "zod/v4";

export const GenerationId = createIdGenerator("gnr");
export type GenerationId = z.infer<typeof GenerationId.schema>;
