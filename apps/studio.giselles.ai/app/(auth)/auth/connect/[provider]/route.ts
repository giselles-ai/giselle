import { connectIdentity, type OAuthProvider } from "@/services/accounts";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ provider: OAuthProvider }> },
) {
	const provider = (await params).provider;
	await connectIdentity(provider, "/connected");
}
