import { GoogleAuthenticationPresentation } from "../../components/v2/google-authentication-presentation";
import { ProviderConnectionButton } from "../../components/v2/provider-connection-button";

import { getGoogleIdentityState } from "@/services/accounts";
import { TriangleAlert } from "lucide-react";
import {
	connectGoogleIdentity,
	disconnectGoogleIdentity,
	reconnectGoogleIdentity,
} from "../actions";

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
				className="border-warning-900 bg-warning-900 hover:text-warning-900"
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
			className="border-black-400 bg-black-400 text-black-200"
		>
			Disconnect
		</ProviderConnectionButton>
	);
}
