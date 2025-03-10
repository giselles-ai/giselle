import type {
	GitHubAppUserAuth,
	GitHubInstallationAppAuth,
	GitHubTokenAuth,
} from "@giselle-sdk/github-client";
import type { LanguageModelProvider } from "@giselle-sdk/language-model";
import type { Storage } from "unstorage";

export interface GiselleEngineContext {
	storage: Storage;
	llmProviders: LanguageModelProvider[];
	integrationConfigs?: GiselleIntegrationConfig[];
}

export interface GitHubIntegrationConfig {
	provider: "github";
	auth:
		| GitHubTokenAuth
		| Omit<GitHubAppUserAuth, "token" | "refreshToken">
		| Omit<GitHubInstallationAppAuth, "installationId">;
}

export type GiselleIntegrationConfig = GitHubIntegrationConfig;

export interface GiselleEngineConfig {
	storage: Storage;
	llmProviders?: LanguageModelProvider[];
	integrationConfigs?: GiselleIntegrationConfig[];
}
