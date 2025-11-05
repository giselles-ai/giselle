import { z } from "zod/v4";
import { FlowTriggerId } from "../flow";

export const GitHubRepositoryIntegrationIndex = z.object({
	repositoryNodeId: z.string(),
	flowTriggerIds: z.array(FlowTriggerId.schema),
});
export type GitHubRepositoryIntegrationIndex = z.infer<
	typeof GitHubRepositoryIntegrationIndex
>;
