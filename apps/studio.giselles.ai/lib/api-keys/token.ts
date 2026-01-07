import { ApiKeyId, type ApiKeyId as ApiKeyIdType } from "@/db/schema";

type ParsedApiToken = {
	apiKeyId: ApiKeyIdType;
	secret: string;
};

function parseApiToken(token: string): ParsedApiToken | null {
	const [apiKeyId, secret, ...extra] = token.split(".");
	if (extra.length > 0) {
		return null;
	}
	if (!apiKeyId || !secret) {
		return null;
	}
	const parsedApiKeyId = ApiKeyId.safeParse(apiKeyId);
	if (!parsedApiKeyId.success) {
		return null;
	}
	return {
		apiKeyId: parsedApiKeyId.data,
		secret,
	};
}

export function parseAuthorizationHeader(
	authorizationHeader: string | null,
): ParsedApiToken | null {
	if (!authorizationHeader) {
		return null;
	}
	const [scheme, token, ...extra] = authorizationHeader.trim().split(/\s+/);
	if (extra.length > 0) {
		return null;
	}
	if (scheme !== "Bearer" || !token) {
		return null;
	}
	return parseApiToken(token);
}
