export interface GitHubInstallationAppAuth {
	strategy: "app-installation";
	appId: string;
	privateKey: string;
	installationId: number;
}

export interface GitHubAppAuth {
	strategy: "app";
	appId: string;
	privateKey: string;
}

export interface GitHubPersonalAccessTokenAuth {
	strategy: "personal-access-token";
	personalAccessToken: string;
}

export type GitHubAuthConfig =
	| GitHubInstallationAppAuth
	| GitHubAppAuth
	| GitHubPersonalAccessTokenAuth;
