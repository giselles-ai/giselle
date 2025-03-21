"use server";

import { getGitHubIdentityState } from "@/services/accounts";
import { TriangleAlert } from "lucide-react";
import { GitHubAuthenticationPresentation } from "../../components/v2/github-authentication-presentation";
import { ProviderConnectionButton } from "../../components/v2/provider-connection-button";
import {
	connectGitHubIdentity,
	disconnectGitHubIdentity,
	reconnectGitHubIdentity,
} from "../actions";

export async function GitHubAuthentication() {
	const identityState = await getGitHubIdentityState();

	if (identityState.status === "unauthorized") {
		return <GitHubAuthenticationPresentation button={GitHubConnectButton} />;
	}
	if (identityState.status === "invalid-credential") {
		return (
			<GitHubAuthenticationPresentation
				button={GitHubReconnectButton}
				alert="Your GitHub access token has expired or become invalid. Please reconnect to continue using the service."
			/>
		);
	}

	return (
		<GitHubAuthenticationPresentation
			gitHubUser={identityState.gitHubUser}
			button={identityState.unlinkable ? GitHubDisconnectButton : undefined}
		/>
	);
}

function GitHubConnectButton() {
	return (
		<ProviderConnectionButton action={connectGitHubIdentity}>
			Connect
		</ProviderConnectionButton>
	);
}

function GitHubReconnectButton() {
	return (
		<div>
			<ProviderConnectionButton
				action={reconnectGitHubIdentity}
				className="border-warning-900 bg-warning-900 hover:text-warning-900"
			>
				<TriangleAlert /> Reconnect
			</ProviderConnectionButton>
		</div>
	);
}

function GitHubDisconnectButton() {
	return (
		<ProviderConnectionButton
			action={disconnectGitHubIdentity}
			className="border-black-400 bg-black-400 text-black-200"
		>
			Disconnect
		</ProviderConnectionButton>
	);
}
