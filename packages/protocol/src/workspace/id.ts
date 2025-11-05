import { createIdGenerator } from "@giselle-ai/utils";
import type { z } from "zod/v4";

export const WorkspaceId = createIdGenerator("wrks");
export type WorkspaceId = z.infer<typeof WorkspaceId.schema>;
