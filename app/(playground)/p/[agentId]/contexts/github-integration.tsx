"use client";

import type { gitHubIntegrations, githubIntegrationSettings } from "@/drizzle";
import type { components } from "@octokit/openapi-types";
import {
	createContext,
	useCallback,
	useContext,
	useOptimistic,
	useState,
} from "react";
import type {
	CreateGitHubIntegrationSettingResult,
	GitHubIntegrationSetting,
} from "../lib/github";

type Repository = components["schemas"]["repository"];

export interface GitHubIntegrationState {
	repositories: Repository[];
	needsAuthorization: boolean;
	setting: GitHubIntegrationSetting | undefined;
	upsertGitHubIntegrationSettingAction: (
		_: unknown,
		formData: FormData,
	) => Promise<CreateGitHubIntegrationSettingResult>;
}

export const GitHubIntegrationContext =
	createContext<GitHubIntegrationState | null>(null);

export function GitHubIntegrationProvider({
	children,
	setting: defaultSetting,
	upsertGitHubIntegrationSettingAction,
	...value
}: GitHubIntegrationState & {
	children: React.ReactNode;
}) {
	const [serverSetting, setServerSetting] = useState(defaultSetting);

	const handleUpsertGitHubIntegrationSettingAction = useCallback(
		async (_: unknown, formData: FormData) => {
			const result = await upsertGitHubIntegrationSettingAction(_, formData);
			if (result.result === "success") {
				setServerSetting(result.setting);
			}
			return result;
		},
		[upsertGitHubIntegrationSettingAction],
	);

	return (
		<GitHubIntegrationContext.Provider
			value={{
				...value,
				setting: serverSetting,
				upsertGitHubIntegrationSettingAction:
					handleUpsertGitHubIntegrationSettingAction,
			}}
		>
			{children}
		</GitHubIntegrationContext.Provider>
	);
}

export function useGitHubIntegration() {
	const context = useContext(GitHubIntegrationContext);
	if (!context) {
		throw new Error(
			"useGitHubIntegration must be used within a GitHubIntegrationProvider",
		);
	}
	return context;
}
