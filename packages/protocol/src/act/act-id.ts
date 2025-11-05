import { createIdGenerator } from "@giselles-ai/utils";
import type z from "zod/v4";

export const ActId = createIdGenerator("act");
export type ActId = z.infer<typeof ActId.schema>;
