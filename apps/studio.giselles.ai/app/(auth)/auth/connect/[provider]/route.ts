import { connectIdentity, type OAuthProvider } from "@/services/accounts";

function isValidOAuthProvider(provider: string): provider is OAuthProvider {
	return provider === "github" || provider === "google";
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ provider: string }> },
) {
	const { provider: providerParam } = await params;

	// Validate provider parameter
	if (!isValidOAuthProvider(providerParam)) {
		return new Response(`Invalid provider: ${providerParam}`, { status: 400 });
	}
	const provider: OAuthProvider = providerParam;

	await connectIdentity(provider, "/connected");
}
