"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type {
	CreateGitHubIntegrationSettingResult,
	GitHubIntegrationState,
} from "../lib/github";

export type GitHubIntegrationContextType = GitHubIntegrationState & {
	installUrl: string;
	connectGitHubIdentityAction: () => Promise<void>;
	reconnectGitHubIdentityAction: () => Promise<void>;
	upsertGitHubIntegrationSettingAction: (
		_: unknown,
		formData: FormData,
	) => Promise<CreateGitHubIntegrationSettingResult>;
};

export const GitHubIntegrationContext =
	createContext<GitHubIntegrationContextType | null>(null);

export function GitHubIntegrationProvider({
	children,
	setting: defaultSetting,
	upsertGitHubIntegrationSettingAction,
	...value
}: GitHubIntegrationContextType & {
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
