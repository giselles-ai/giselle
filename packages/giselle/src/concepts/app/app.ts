import { createIdGenerator } from "@giselles-ai/utils";
import type z from "zod/v4";

export const AppId = createIdGenerator("app");
export type AppId = z.infer<typeof AppId.schema>;
