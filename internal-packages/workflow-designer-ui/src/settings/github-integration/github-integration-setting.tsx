"use client";

import { useIntegration } from "@giselle-sdk/integration/react";
import { RequireAuthorization } from "./require-authorization";
import { RequireInstallation } from "./require-installation";
import { SetupIntegration } from "./setup-integration";

export function GitHubIntegrationSetting() {
	const { github } = useIntegration();
	switch (github.status) {
		case "unset":
		case "unauthorized":
			return <RequireAuthorization />;
		case "invalid-credential":
			return (
				<RequireAuthorization error="Your GitHub access token has expired or is invalid. Please re-authorize with GitHub." />
			);
		case "not-installed":
			return <RequireInstallation />;
		case "installed":
			return <SetupIntegration repositories={github.repositories} />;
		default: {
			const _exhaustiveCheck: never = github;
			throw new Error(`Unhandled status: ${_exhaustiveCheck}`);
		}
	}
}
