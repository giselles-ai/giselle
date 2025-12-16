import { redirect } from "next/navigation";
import { deleteOauthCredential, getAuthCallbackUrl } from "@/app/(auth)/lib";
import { createClient, getUser } from "@/lib/supabase";
import type { OAuthProvider } from "./oauth-credentials";

type OAuthOptionOverrides = {
	queryParams?: Record<string, string>;
	scopes?: string[];
};

const providerOptionOverrides: Record<OAuthProvider, OAuthOptionOverrides> = {
	github: {},
	google: {
		queryParams: {
			access_type: "offline",
			prompt: "consent",
		},
		scopes: ["openid", "email", "profile"],
	},
};

function buildProviderOptions(provider: OAuthProvider) {
	const overrides = providerOptionOverrides[provider];
	const { scopes, ...rest } = overrides;
	return scopes ? { ...rest, scopes: scopes.join(" ") } : rest;
}

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

	let data: { provider: string; url: string | null } | null = null;
	let error: {
		code?: string;
		message?: string;
		name?: string;
		status?: number;
	} | null = null;
	const redirectTo = getAuthCallbackUrl({ next, provider });
	try {
		({ data, error } = await supabase.auth.linkIdentity({
			provider,
			options: {
				redirectTo,
				...buildProviderOptions(provider),
			},
		}));
	} catch (e) {
		throw new Error(
			`Failed to initiate ${provider} linkIdentity: ${String(e)}`,
		);
	}

	if (error != null) {
		const { code, message, name, status } = error;
		throw new Error(`${name} occurred: ${code} (${status}): ${message}`);
	}

	if (data?.url) redirect(data.url);
	throw new Error(
		`OAuth did not return redirect URL. Verify Redirect URLs include: ${redirectTo}`,
	);
}

export async function reconnectIdentity(provider: OAuthProvider, next: string) {
	const supabase = await createClient();
	let data: { provider: string; url: string | null } | null = null;
	let error: {
		code?: string;
		message?: string;
		name?: string;
		status?: number;
	} | null = null;
	const redirectTo2 = getAuthCallbackUrl({ next, provider });
	try {
		({ data, error } = await supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: redirectTo2,
				...buildProviderOptions(provider),
			},
		}));
	} catch (e) {
		throw new Error(
			`Failed to initiate ${provider} signInWithOAuth: ${String(e)}`,
		);
	}

	if (error != null) {
		const { code, message, name, status } = error;
		throw new Error(`${name} occurred: ${code} (${status}): ${message}`);
	}
	if (data?.url) redirect(data.url);
	throw new Error(
		`OAuth did not return redirect URL. Verify Redirect URLs include: ${redirectTo2}`,
	);
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
