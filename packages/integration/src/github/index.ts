import type { components } from "@octokit/openapi-types";
import { z } from "zod";

export const GitHubIntegrationUnsetState = z.object({
	status: z.literal("unset"),
});
export const GitHubIntegrationUnauthorizedState = z.object({
	status: z.literal("unauthorized"),
	authUrl: z.string().url(),
});
export type GitHubIntegrationUnauthorizedState = z.infer<
	typeof GitHubIntegrationUnauthorizedState
>;
export const GitHubIntegrationInvalidCredentialState = z.object({
	status: z.literal("invalid-credential"),
});
export type GitHubIntegrationInvalidCredentialState = z.infer<
	typeof GitHubIntegrationInvalidCredentialState
>;
export const GitHubIntegrationNotInstalledState = z.object({
	status: z.literal("not-installed"),
	installationUrl: z.string().url(),
});
export type GitHubIntegrationNotInstalledState = z.infer<
	typeof GitHubIntegrationNotInstalledState
>;
export type GitHubIntegrationRepository = components["schemas"]["repository"];
export type GitHubIntegrationInstallation =
	components["schemas"]["installation"] & {
		repositories: GitHubIntegrationRepository[];
	};
export const GitHubIntegrationInstalledState = z.object({
	status: z.literal("installed"),
	repositories: z.custom<GitHubIntegrationRepository[]>(),
	installations: z.custom<GitHubIntegrationInstallation[]>(),
	installationUrl: z.string().url(),
});
export type GitHubIntegrationInstalledState = z.infer<
	typeof GitHubIntegrationInstalledState
>;

export const GitHubIntegrationErrorState = z.object({
	status: z.literal("error"),
	errorMessage: z.string(),
});
export type GitHubIntegrationErrorState = z.infer<
	typeof GitHubIntegrationErrorState
>;
export const GitHubIntegrationState = z.discriminatedUnion("status", [
	GitHubIntegrationUnsetState,
	GitHubIntegrationUnauthorizedState,
	GitHubIntegrationInvalidCredentialState,
	GitHubIntegrationNotInstalledState,
	GitHubIntegrationInstalledState,
	GitHubIntegrationErrorState,
]);
export type GitHubIntegration = z.infer<typeof GitHubIntegrationState>;
