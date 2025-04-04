import type { components } from "@octokit/openapi-types";
import type { ReactNode } from "react";
import { z } from "zod";

export const GitHubIntegrationUnsetState = z.object({
	status: z.literal("unset"),
});
export const GitHubIntegrationUnauthorizedState = z.object({
	status: z.literal("unauthorized"),
});
export const GitHubIntegrationInvalidCredentialState = z.object({
	status: z.literal("invalid-credential"),
});
export const GitHubIntegrationNotInstalledState = z.object({
	status: z.literal("not-installed"),
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
export const GitHubIntegration = z.object({
	state: GitHubIntegrationState,
	components: z
		.object({
			authentication: z.custom<ReactNode>(),
			installation: z.custom<ReactNode>(),
		})
		.optional(),
});
export type GitHubIntegration = z.infer<typeof GitHubIntegration>;
