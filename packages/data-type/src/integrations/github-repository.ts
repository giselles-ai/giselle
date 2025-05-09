import { z } from "zod";
import { FlowTriggerId } from "../flow";

export const GitHubRepositoryIntegrationIndex = z.object({
	repositoryNodeId: z.string(),
	flowTriggerIds: z.array(FlowTriggerId.schema),
});
export type GitHubRepositoryIntegrationIndex = z.infer<
	typeof GitHubRepositoryIntegrationIndex
>;
