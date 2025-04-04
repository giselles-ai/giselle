"use client";

import { useIntegration } from "@giselle-sdk/integration/react";
import { RequireAuthorization } from "./require-authorization";

export function GitHubIntegrationSetting() {
	const {
		github: { state: gitHubState },
	} = useIntegration();

	switch (gitHubState.status) {
		case "unset":
		case "unauthorized":
			return <RequireAuthorization />;
		case "invalid-credential":
			return (
				<RequireAuthorization error="Your GitHub access token has expired or is invalid. Please re-authorize with GitHub." />
			);
		case "not-installed":
		case "installed":
			return <RequireAuthorization />;

		// case "not-installed":
		// 	return <RequireInstallation />;
		// case "installed":
		// 	return <SetupIntegration repositories={gitHubState.repositories} />;
		default: {
			const _exhaustiveCheck: never = gitHubState;
			throw new Error(`Unhandled status: ${_exhaustiveCheck}`);
		}
	}
}
