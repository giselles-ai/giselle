import type { components } from "@octokit/openapi-types";
import { z } from "zod";
export type { InstallationWithRepositories } from "@giselle-sdk/github-client";

export type GitHubAppInstallationId =
	components["schemas"]["installation"]["id"];

export const GitHubIntegration = z.object({
	provider: z.literal("github"),
	integrationIds: z.array(z.custom<GitHubAppInstallationId>()),
});
