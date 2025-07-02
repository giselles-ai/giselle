import { TriangleAlert } from "lucide-react";
import { getGoogleIdentityState } from "@/services/accounts";
import { Button } from "../components/button";
import { GoogleAuthenticationPresentation } from "../components/google-authentication-presentation";
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
		<form action={connectGoogleIdentity}>
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

function GoogleReconnectButton() {
	return (
		<form action={reconnectGoogleIdentity}>
			<Button variant="destructive" type="submit">
				<TriangleAlert /> Reconnect
			</Button>
		</form>
	);
}

function GoogleDisconnectButton() {
	return (
		<form action={disconnectGoogleIdentity}>
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
