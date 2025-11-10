import { z } from "zod/v4";
import { TriggerId } from "../trigger";

export const GitHubRepositoryIntegrationIndex = z.object({
	repositoryNodeId: z.string(),
	flowTriggerIds: z.array(TriggerId.schema),
});
export type GitHubRepositoryIntegrationIndex = z.infer<
	typeof GitHubRepositoryIntegrationIndex
>;
