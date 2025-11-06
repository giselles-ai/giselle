import z from "zod/v4";
import { GitHubAction } from "./github";

export * from "./github";

export const ActionProvider = z.union([GitHubAction.shape.provider]);
export type ActionProvider = z.infer<typeof ActionProvider>;
