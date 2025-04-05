import type { components } from "@octokit/openapi-types";
import { z } from "zod";

export const GitHubIntegrationUnsetState = z.object({
	status: z.literal("unset"),
	settingPageUrl: z.string(),
});
export const GitHubIntegrationUnauthorizedState = z.object({
	status: z.literal("unauthorized"),
	settingPageUrl: z.string(),
});
export const GitHubIntegrationInvalidCredentialState = z.object({
	status: z.literal("invalid-credential"),
	settingPageUrl: z.string(),
});
export const GitHubIntegrationNotInstalledState = z.object({
	status: z.literal("not-installed"),
	settingPageUrl: z.string(),
});
export type GitHubIntegrationRepository = components["schemas"]["repository"];
export const GitHubIntegrationInstalledState = z.object({
	status: z.literal("installed"),
	repositories: z.custom<GitHubIntegrationRepository[]>(),
});
export const GitHubIntegrationState = z.discriminatedUnion("status", [
	GitHubIntegrationUnsetState,
	GitHubIntegrationUnauthorizedState,
	GitHubIntegrationInvalidCredentialState,
	GitHubIntegrationNotInstalledState,
	GitHubIntegrationInstalledState,
]);
export type GitHubIntegrationState = z.infer<typeof GitHubIntegrationState>;
