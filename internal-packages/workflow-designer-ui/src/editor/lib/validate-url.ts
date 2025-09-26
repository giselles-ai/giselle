/**
 * Normalize and validate a URL string.
 * Returns a Web URL object when the string is valid and matches the allowed protocols.
 * @param raw - Raw user input to validate.
 * @param options - Optional restrictions for accepted protocols.
 */
export function validateUrl(
	raw: string | null | undefined,
	options?: {
		allowedProtocols?: string[];
	},
): URL | null {
	if (raw === undefined || raw === null) {
		return null;
	}

	const trimmed = raw.trim();
	if (trimmed.length === 0) {
		return null;
	}

	try {
		const parsed = new URL(trimmed);
		const allowedProtocols = options?.allowedProtocols;
		if (Array.isArray(allowedProtocols) && allowedProtocols.length > 0) {
			return allowedProtocols.includes(parsed.protocol) ? parsed : null;
		}
		return parsed.protocol === "http:" || parsed.protocol === "https:"
			? parsed
			: null;
	} catch {
		return null;
	}
}
