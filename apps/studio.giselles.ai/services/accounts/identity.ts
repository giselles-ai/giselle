import { redirect } from "next/navigation";
import { deleteOauthCredential, getAuthCallbackUrl } from "@/app/(auth)/lib";
import { createClient, getUser } from "@/lib/supabase";
import type { OAuthProvider } from "./oauth-credentials";

export async function connectIdentity(provider: OAuthProvider, next: string) {
	const supabase = await createClient();

	// Manual linking allows the user to link multiple same-provider identities.
	// But it introduces additional complexity, and not suitable for most use cases.
	// We should check if the user already has the given provider identity here.
	// https://supabase.com/docs/guides/auth/auth-identity-linking#manual-linking-beta
	const supabaseUser = await getUser();
	if (supabaseUser.identities) {
		const existingIdentity = supabaseUser.identities.find(
			(it) => it.provider === provider,
		);
		if (existingIdentity) {
			throw new Error(`Already linked to ${provider}`);
		}
	}

	const { data, error } = await supabase.auth.linkIdentity({
		provider,
		options: {
			redirectTo: getAuthCallbackUrl({ next, provider }),
		},
	});

	if (error != null) {
		const { code, message, name, status } = error;
		throw new Error(`${name} occurred: ${code} (${status}): ${message}`);
	}

	if (data.url) {
		redirect(data.url);
	}
}

export async function reconnectIdentity(provider: OAuthProvider, next: string) {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.signInWithOAuth({
		provider,
		options: {
			redirectTo: getAuthCallbackUrl({ next, provider }),
		},
	});

	if (error != null) {
		const { code, message, name, status } = error;
		throw new Error(`${name} occurred: ${code} (${status}): ${message}`);
	}
	if (data.url) {
		redirect(data.url);
	}
}

export async function disconnectIdentity(
	provider: OAuthProvider,
	next: string,
) {
	const supabaseUser = await getUser();
	const supabase = await createClient();
	if (!supabaseUser.identities) {
		throw new Error("No identities");
	}
	if (supabaseUser.identities.length === 1) {
		throw new Error("Cannot unlink last identity");
	}
	const identity = supabaseUser.identities.find(
		(it) => it.provider === provider,
	);
	if (!identity) {
		throw new Error(`No ${provider} identity`);
	}
	const { error } = await supabase.auth.unlinkIdentity(identity);
	if (error) {
		throw new Error("Failed to unlink identity", { cause: error });
	}

	await deleteOauthCredential(provider);
	redirect(next);
}
