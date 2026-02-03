import dns from "node:dns";

type ValidationResult = { isValid: true } | { isValid: false; error: string };

/**
 * Checks if an IP address is in a private/internal range that should be blocked.
 *
 * Blocked ranges (RFC 6890 and common SSRF targets):
 * - 0.0.0.0/8 ("This host" - often routes to localhost)
 * - 127.0.0.0/8 (Localhost)
 * - 10.0.0.0/8 (Private Class A)
 * - 100.64.0.0/10 (Carrier-grade NAT / Shared Address Space)
 * - 172.16.0.0/12 (Private Class B)
 * - 192.168.0.0/16 (Private Class C)
 * - 192.0.0.0/24 (IETF Protocol Assignments)
 * - 169.254.0.0/16 (Link-local / AWS metadata)
 * - 198.18.0.0/15 (Benchmarking)
 * - 224.0.0.0/4 (Multicast)
 * - 240.0.0.0/4 (Reserved for future use)
 * - 255.255.255.255 (Broadcast)
 */
export function isPrivateIP(ip: string): boolean {
	const parts = ip.split(".");

	// Validate IPv4 format with strict segment checks (no leading zeros)
	if (parts.length !== 4) {
		// For non-IPv4 addresses (e.g., IPv6), treat as potentially private for safety
		return true;
	}

	const nums: number[] = [];
	for (const part of parts) {
		const num = Number(part);
		if (Number.isNaN(num) || num < 0 || num > 255 || String(num) !== part) {
			// For non-canonical IPv4 addresses (e.g., leading zeros), treat as private for safety
			return true;
		}
		nums.push(num);
	}

	const [a, b] = nums;

	// 0.0.0.0/8 - "This host" (often routes to localhost on Linux)
	if (a === 0) {
		return true;
	}

	// 127.0.0.0/8 - Localhost
	if (a === 127) {
		return true;
	}

	// 10.0.0.0/8 - Private Class A
	if (a === 10) {
		return true;
	}

	// 100.64.0.0/10 - Carrier-grade NAT (Shared Address Space)
	if (a === 100 && b >= 64 && b <= 127) {
		return true;
	}

	// 172.16.0.0/12 - Private Class B (172.16.x.x to 172.31.x.x)
	if (a === 172 && b >= 16 && b <= 31) {
		return true;
	}

	// 192.0.0.0/24 - IETF Protocol Assignments
	if (a === 192 && b === 0) {
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

	// 198.18.0.0/15 - Benchmarking
	if (a === 198 && (b === 18 || b === 19)) {
		return true;
	}

	// 224.0.0.0/4 - Multicast
	if (a >= 224 && a <= 239) {
		return true;
	}

	// 240.0.0.0/4 - Reserved for future use (includes 255.255.255.255 broadcast)
	if (a >= 240) {
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
 * Checks if a string looks like an IPv6 address.
 * IPv6 addresses contain colons (e.g., ::1, 2001:db8::1)
 */
function isIPv6Address(host: string): boolean {
	return host.includes(":");
}

/**
 * PostgreSQL connection string query parameters that can override the hostname.
 * These are libpq parameters that pg uses to determine the actual connection target.
 */
const HOST_OVERRIDE_PARAMS = ["host", "hostaddr"];

/**
 * Validates a single host value (IP or hostname) for SSRF vulnerabilities.
 */
async function validateHost(host: string): Promise<ValidationResult> {
	// Block IPv6 addresses directly (fail-safe: we don't support IPv6 validation)
	if (isIPv6Address(host)) {
		return {
			isValid: false,
			error: "IPv6 addresses are not supported",
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

/**
 * Validates a PostgreSQL connection string for SSRF vulnerabilities.
 *
 * Checks:
 * 1. Protocol must be postgresql:// or postgres://
 * 2. Host must not resolve to a private/internal IP address
 * 3. Query parameters (host, hostaddr) must not override to private IPs
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

	// Check for host/hostaddr query parameter overrides (libpq parameters)
	// An attacker could use postgresql://user@public.example/db?hostaddr=169.254.169.254
	// to bypass hostname validation while connecting to a private IP.
	for (const param of HOST_OVERRIDE_PARAMS) {
		const paramValue = url.searchParams.get(param);
		if (paramValue) {
			// libpq allows comma-separated hosts; validate each one
			const hosts = paramValue.split(",");
			for (const h of hosts) {
				const trimmedHost = h.trim();
				if (trimmedHost) {
					const result = await validateHost(trimmedHost);
					if (!result.isValid) {
						return result;
					}
				}
			}
		}
	}

	// Validate the main hostname
	return validateHost(host);
}
