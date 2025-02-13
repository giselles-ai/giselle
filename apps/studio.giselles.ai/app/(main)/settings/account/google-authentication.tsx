import { GoogleAuthenticationPresentation } from "../components/google-authentication-presentation";
import { ProviderConnectionButton } from "../components/provider-connection-button";

import { getGoogleIdentityState } from "@/services/accounts";
import { TriangleAlert } from "lucide-react";
import {
	connectGoogleIdentity,
	disconnectGoogleIdentity,
	reconnectGoogleIdentity,
} from "./actions";

const provider = "google";

export async function GoogleAuthentication() {
	const identityState = await getGoogleIdentityState();

	if (identityState.status === "unauthorized") {
		return <GoogleAuthenticationPresentation button={GoogleConnectButton} />;
	}

	if (identityState.status === "invalid-credential") {
		return <GoogleAuthenticationPresentation button={GoogleReconnectButton} />;
	}

	return (
		<GoogleAuthenticationPresentation
			googleUser={identityState.googleUser}
			button={identityState.unlinkable ? GoogleDisconnectButton : undefined}
		/>
	);
}

function GoogleConnectButton() {
	return (
		<ProviderConnectionButton action={connectGoogleIdentity}>
			Connect
		</ProviderConnectionButton>
	);
}

function GoogleReconnectButton() {
	return (
		<div>
			<ProviderConnectionButton
				action={reconnectGoogleIdentity}
				className="text-yellow-500"
			>
				<TriangleAlert /> Reconnect
			</ProviderConnectionButton>
		</div>
	);
}

function GoogleDisconnectButton() {
	return (
		<ProviderConnectionButton
			action={disconnectGoogleIdentity}
			className="text-red-500"
		>
			Disconnect
		</ProviderConnectionButton>
	);
}
