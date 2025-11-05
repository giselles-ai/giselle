import { createIdGenerator } from "@giselles-ai/utils";
import type { z } from "zod/v4";

// ID generators that are shared between multiple modules
// These are extracted here to avoid circular dependencies

export const AppId = createIdGenerator("app");
export type AppId = z.infer<typeof AppId.schema>;
