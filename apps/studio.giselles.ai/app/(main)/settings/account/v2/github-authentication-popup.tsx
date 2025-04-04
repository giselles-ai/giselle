"use server";

import { getGitHubIdentityState } from "@/services/accounts";
import { GitHubAuthenticationPopupButton } from "../../components/v2/github-authentication-popup-button";
import { GitHubAuthenticationPresentation } from "../../components/v2/github-authentication-presentation";

export async function GitHubAuthenticationPopup({ next }: { next?: string }) {
	const identityState = await getGitHubIdentityState();

	if (identityState.status === "unauthorized") {
		return (
			<GitHubAuthenticationPresentation
				button={() => GitHubConnectButton({ next })}
			/>
		);
	}
	if (identityState.status === "invalid-credential") {
		return (
			<GitHubAuthenticationPresentation
				button={() => GitHubReconnectButton({ next })}
				alert="Your GitHub access token has expired or become invalid. Please reconnect to continue using the service."
			/>
		);
	}

	return (
		<GitHubAuthenticationPresentation
			gitHubUser={identityState.gitHubUser}
			button={
				identityState.unlinkable
					? () => GitHubDisconnectButton({ next })
					: undefined
			}
		/>
	);
}

function GitHubConnectButton({ next }: { next?: string }) {
	return (
		<GitHubAuthenticationPopupButton
			href="/api/auth/github/connect"
			label="Connect"
			next={next}
		/>
	);
}

function GitHubReconnectButton({ next }: { next?: string }) {
	return (
		<div>
			<GitHubAuthenticationPopupButton
				href="/api/auth/github/reconnect"
				label="Reconnect"
				className="border-warning-900 bg-warning-900 hover:text-warning-900"
				next={next}
			/>
		</div>
	);
}

function GitHubDisconnectButton({ next }: { next?: string }) {
	return (
		<GitHubAuthenticationPopupButton
			href="/api/auth/github/disconnect"
			label="Disconnect"
			className="border-black-400 bg-black-400 text-black-200"
			next={next}
		/>
	);
}
