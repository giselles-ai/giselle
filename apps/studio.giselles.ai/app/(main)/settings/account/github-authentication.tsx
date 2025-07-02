"use server";

import { TriangleAlert } from "lucide-react";
import { getGitHubIdentityState } from "@/services/accounts";
import { Button } from "../components/button";
import { GitHubAuthenticationPresentation } from "../components/github-authentication-presentation";
import {
	connectGitHubIdentity,
	disconnectGitHubIdentity,
	reconnectGitHubIdentity,
} from "./actions";

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

	if (identityState.status === "error") {
		return (
			<GitHubAuthenticationPresentation
				alert={`GitHub integration error: ${identityState.errorMessage}`}
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
		<form action={connectGitHubIdentity}>
			<Button
				type="submit"
				className="rounded-lg px-4 py-2 text-white/80 transition-all duration-200 active:scale-[0.98]"
				style={{
					background: "linear-gradient(180deg, #202530 0%, #12151f 100%)",
					border: "1px solid rgba(0,0,0,0.7)",
					boxShadow:
						"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
				}}
			>
				Connect
			</Button>
		</form>
	);
}

function GitHubReconnectButton() {
	return (
		<form action={reconnectGitHubIdentity}>
			<Button variant="destructive" type="submit">
				<TriangleAlert /> Reconnect
			</Button>
		</form>
	);
}

function GitHubDisconnectButton() {
	return (
		<form action={disconnectGitHubIdentity}>
			<Button
				type="submit"
				className="rounded-lg px-4 py-2 text-white/80 transition-all duration-200 active:scale-[0.98]"
				style={{
					background: "linear-gradient(180deg, #202530 0%, #12151f 100%)",
					border: "1px solid rgba(0,0,0,0.7)",
					boxShadow:
						"inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(5,10,20,0.4), 0 1px 2px rgba(0,0,0,0.3)",
				}}
			>
				Disconnect
			</Button>
		</form>
	);
}
