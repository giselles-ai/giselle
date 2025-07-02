import { connectIdentity, type OAuthProvider } from "@/services/accounts";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ provider: OAuthProvider }> },
) {
	const provider = (await params).provider;
	await connectIdentity(provider, "/connected");
}
