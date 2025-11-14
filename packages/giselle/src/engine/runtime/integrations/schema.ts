import { z } from "zod/v4";
import { GitHubIntegrationState } from "./provider/github";

export * from "./provider/github";

export const Integration = z.object({
	github: GitHubIntegrationState,
});
export type Integration = z.infer<typeof Integration>;
