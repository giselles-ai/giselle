import type { z } from "zod";
import { GitHubIntegration } from "./github";
export * from "./github";

export const Integration = GitHubIntegration;
export type Integration = z.infer<typeof Integration>;
