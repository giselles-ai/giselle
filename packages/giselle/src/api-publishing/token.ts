import type { ApiKeyId } from "@giselles-ai/protocol";

type ParsedApiToken = {
	apiKeyId: ApiKeyId;
	secret: string;
};

// Token prefix:
// - gsk = "Giselle Secret Key" (a project-specific API token namespace)
// - Prefixing helps distinguish tokens and makes accidental cross-system usage less likely.
const apiTokenPrefix = "gsk_";

export function parseApiToken(token: string): ParsedApiToken | null {
	if (!token.startsWith(apiTokenPrefix)) {
		return null;
	}
	const rest = token.slice(apiTokenPrefix.length);
	const [apiKeyId, secret, ...extra] = rest.split(".");
	if (extra.length > 0) {
		return null;
	}
	if (!apiKeyId || !secret) {
		return null;
	}
	return {
		apiKeyId: apiKeyId as ApiKeyId,
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
