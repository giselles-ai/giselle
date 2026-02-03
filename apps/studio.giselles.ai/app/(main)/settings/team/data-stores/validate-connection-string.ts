import dns from "node:dns";

type ValidationResult = { isValid: true } | { isValid: false; error: string };

/**
 * Checks if an IP address is in a private/internal range that should be blocked.
 *
 * Blocked ranges:
 * - 127.0.0.0/8 (Localhost)
 * - 10.0.0.0/8 (Private Class A)
 * - 172.16.0.0/12 (Private Class B)
 * - 192.168.0.0/16 (Private Class C)
 * - 169.254.0.0/16 (Link-local / AWS metadata)
 */
export function isPrivateIP(ip: string): boolean {
	const parts = ip.split(".").map(Number);

	// Validate IPv4 format
	if (
		parts.length !== 4 ||
		parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)
	) {
		// For non-IPv4 addresses (e.g., IPv6), treat as potentially private for safety
		return true;
	}

	const [a, b] = parts;

	// 127.0.0.0/8 - Localhost
	if (a === 127) {
		return true;
	}

	// 10.0.0.0/8 - Private Class A
	if (a === 10) {
		return true;
	}

	// 172.16.0.0/12 - Private Class B (172.16.x.x to 172.31.x.x)
	if (a === 172 && b >= 16 && b <= 31) {
		return true;
	}

	// 192.168.0.0/16 - Private Class C
	if (a === 192 && b === 168) {
		return true;
	}

	// 169.254.0.0/16 - Link-local / AWS metadata service
	if (a === 169 && b === 254) {
		return true;
	}

	return false;
}

/**
 * Checks if a string is a valid IPv4 address.
 */
function isIPv4Address(host: string) {
	const parts = host.split(".");
	if (parts.length !== 4) {
		return false;
	}
	return parts.every((part) => {
		const num = Number(part);
		return !Number.isNaN(num) && num >= 0 && num <= 255 && String(num) === part;
	});
}

/**
 * Validates a PostgreSQL connection string for SSRF vulnerabilities.
 *
 * Checks:
 * 1. Protocol must be postgresql:// or postgres://
 * 2. Host must not resolve to a private/internal IP address
 */
export async function validateConnectionStringForSSRF(
	connectionString: string,
): Promise<ValidationResult> {
	let url: URL;
	try {
		url = new URL(connectionString);
	} catch {
		return {
			isValid: false,
			error: "Invalid connection string format",
		};
	}

	if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
		return {
			isValid: false,
			error: "Connection string must use postgresql:// or postgres:// protocol",
		};
	}

	const host = url.hostname;
	if (!host) {
		return {
			isValid: false,
			error: "Connection string must include a host",
		};
	}

	if (isIPv4Address(host)) {
		if (isPrivateIP(host)) {
			return {
				isValid: false,
				error: "Connection to private or internal IP addresses is not allowed",
			};
		}
		return { isValid: true };
	}

	try {
		// Use { all: true } to get all resolved IP addresses.
		// An attacker could configure a domain to return both public and private IPs.
		// We must check all resolved addresses to prevent SSRF attacks.
		const addresses = await dns.promises.lookup(host, { all: true });
		for (const { address } of addresses) {
			if (isPrivateIP(address)) {
				return {
					isValid: false,
					error:
						"Connection to private or internal IP addresses is not allowed",
				};
			}
		}

		return { isValid: true };
	} catch {
		return {
			isValid: false,
			error: "Unable to resolve hostname",
		};
	}
}
