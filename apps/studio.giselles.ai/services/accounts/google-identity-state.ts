import { getUser } from "@/lib/supabase";
import {
	buildGoogleUserClient,
	type GoogleUserClient,
	type GoogleUserData,
	needsAuthorization,
} from "../external/google";
import { getOauthCredential } from "./oauth-credentials";

type GoogleIdentityState =
	| GoogleIdentityStateUnauthorized
	| GoogleIdentityStateInvalidCredential
	| GoogleIdentityStateAuthorized;

type GoogleIdentityStateUnauthorized = {
	status: "unauthorized";
};

type GoogleIdentityStateInvalidCredential = {
	status: "invalid-credential";
};

type GoogleIdentityStateAuthorized = {
	status: "authorized";
	googleUser: GoogleUserData;
	googleUserClient: GoogleUserClient;
	unlinkable: boolean;
};

export async function getGoogleIdentityState(): Promise<GoogleIdentityState> {
	const credential = await getOauthCredential("google");
	if (!credential) {
		return { status: "unauthorized" };
	}

	const googleUserClient = buildGoogleUserClient(credential);
	try {
		const googleUser = await googleUserClient.getUser();
		const supabaseUser = await getUser();
		const unlinkable =
			(supabaseUser.identities && supabaseUser.identities.length > 1) ?? false;

		return { status: "authorized", googleUser, googleUserClient, unlinkable };
	} catch (error) {
		if (needsAuthorization(error)) {
			return { status: "invalid-credential" };
		}
		throw error;
	}
}
