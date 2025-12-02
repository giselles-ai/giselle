import levenshtein from "fast-levenshtein";

type ValidationResult = { isValid: true } | { isValid: false; error: string };

/**
 * Recognized PostgreSQL connection parameters
 * Based on the official PostgreSQL 17 documentation:
 * https://www.postgresql.org/docs/17/libpq-connect.html
 */
const RECOGNIZED_PARAMS = new Set([
	"host",
	"hostaddr",
	"port",
	"dbname",
	"user",
	"password",
	"connect_timeout",
	"client_encoding",
	"options",
	"application_name",
	"fallback_application_name",
	"keepalives",
	"keepalives_idle",
	"keepalives_interval",
	"keepalives_count",
	"tcp_user_timeout",
	"sslmode",
	"requiressl",
	"sslcompression",
	"sslcert",
	"sslkey",
	"sslrootcert",
	"sslcrl",
	"requirepeer",
	"krbsrvname",
	"gsslib",
	"service",
	"target_session_attrs",
	"passfile",
	"channel_binding",
]);

const SSL_MODES = new Set([
	"disable",
	"allow",
	"prefer",
	"require",
	"verify-ca",
	"verify-full",
]);

// Characters that need percent-encoding in URI components
const SPECIAL_CHARS_REGEX = /[@:#/?&=%\s[\]]/;

/**
 * Validates query parameters in URI format
 * Only validates format and specific known parameters, allows unknown parameters
 */
function validateQueryParams(params: string): ValidationResult {
	const paramPairs = params.split("&");
	for (const pair of paramPairs) {
		if (!pair.includes("=")) {
			return {
				isValid: false,
				error: `Invalid parameter format. Expected 'key=value'`,
			};
		}
		const eqIndex = pair.indexOf("=");
		const key = pair.substring(0, eqIndex);
		const value = pair.substring(eqIndex + 1);
		if (!key || !value) {
			return {
				isValid: false,
				error: `Invalid parameter format. Expected 'key=value'`,
			};
		}

		// Check if value contains spaces (which should be encoded)
		if (value.includes(" ")) {
			return {
				isValid: false,
				error: `Invalid parameter format. Expected 'key=value'`,
			};
		}

		const decodedKey = decodeURIComponent(key);
		// Only validate known parameters, allow unknown ones
		if (RECOGNIZED_PARAMS.has(decodedKey)) {
			// Validate specific parameter values
			if (
				decodedKey === "sslmode" &&
				!SSL_MODES.has(decodeURIComponent(value))
			) {
				return {
					isValid: false,
					error: `Invalid sslmode value '${decodeURIComponent(value)}'. Valid values are: ${Array.from(SSL_MODES).join(", ")}`,
				};
			}

			if (decodedKey === "port") {
				const portNum = Number(decodeURIComponent(value));
				if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
					return {
						isValid: false,
						error: `The port '${decodeURIComponent(value)}' is not a valid number.`,
					};
				}
			}
		}
	}
	return { isValid: true };
}

/**
 * Parse key-value format with support for quoted values
 */
function parseKeyValuePairs(
	kvString: string,
): Array<{ key: string; value: string }> {
	const pairs: Array<{ key: string; value: string }> = [];
	let currentPos = 0;

	while (currentPos < kvString.length) {
		// Skip whitespace
		while (currentPos < kvString.length && /\s/.test(kvString[currentPos])) {
			currentPos++;
		}

		if (currentPos >= kvString.length) break;

		// Find key
		const keyStart = currentPos;
		while (
			currentPos < kvString.length &&
			kvString[currentPos] !== "=" &&
			!/\s/.test(kvString[currentPos])
		) {
			currentPos++;
		}

		if (currentPos >= kvString.length || kvString[currentPos] !== "=") {
			// Invalid format - no equals sign
			return [];
		}

		const key = kvString.substring(keyStart, currentPos);
		currentPos++; // Skip '='

		// Find value
		let value = "";
		if (kvString[currentPos] === "'") {
			// Quoted value
			currentPos++; // Skip opening quote
			const valueStart = currentPos;
			while (currentPos < kvString.length && kvString[currentPos] !== "'") {
				currentPos++;
			}
			if (currentPos >= kvString.length) {
				// Unclosed quote
				return [];
			}
			value = kvString.substring(valueStart, currentPos);
			currentPos++; // Skip closing quote
		} else {
			// Unquoted value
			const valueStart = currentPos;
			while (currentPos < kvString.length && !/\s/.test(kvString[currentPos])) {
				currentPos++;
			}
			value = kvString.substring(valueStart, currentPos);
		}

		pairs.push({ key, value });
	}

	return pairs;
}

/**
 * Validates if a URI component contains unencoded special characters
 * @param value - The URI component to validate
 * @param fieldName - The name of the field for error messages
 * @returns ValidationResult indicating if the value is properly encoded
 */
function validateURIComponent(
	value: string | undefined,
	fieldName: string,
): ValidationResult {
	if (!value) {
		return { isValid: true };
	}

	try {
		const decoded = decodeURIComponent(value);
		// If decoding changes the value, it was already encoded
		if (decoded === value && SPECIAL_CHARS_REGEX.test(value)) {
			const specialChar = value.match(SPECIAL_CHARS_REGEX)?.[0];
			return {
				isValid: false,
				error: `The ${fieldName} contains a special character ('${specialChar}') that should be percent-encoded to '${encodeURIComponent(specialChar || "")}'.`,
			};
		}
		return { isValid: true };
	} catch {
		// Invalid encoding
		return {
			isValid: false,
			error: `The ${fieldName} contains invalid percent-encoding`,
		};
	}
}

export function validatePostgreSQLConnectionString(
	connectionString: string,
): ValidationResult {
	if (!connectionString || connectionString.trim() === "") {
		return { isValid: false, error: "Connection string cannot be empty" };
	}

	const trimmed = connectionString.trim();

	// Check if it's URI format
	if (
		trimmed.startsWith("postgresql://") ||
		trimmed.startsWith("postgres://")
	) {
		return validateURIFormat(trimmed);
	}

	// Check if it looks like a URI but with wrong scheme
	if (trimmed.includes("://")) {
		return {
			isValid: false,
			error:
				"Invalid connection string format. It should start with `postgresql://`.",
		};
	}

	// Check if it looks like a URI without scheme (contains @ and /)
	if (trimmed.includes("@") && trimmed.includes("/")) {
		return {
			isValid: false,
			error:
				"Invalid connection string format. It should start with `postgresql://`.",
		};
	}

	// Otherwise, validate as key-value format
	return validateKeyValueFormat(trimmed);
}

function validateURIFormat(uri: string): ValidationResult {
	try {
		// First, check basic format
		const schemeMatch = uri.match(/^(postgresql|postgres):\/\//);
		if (!schemeMatch) {
			return {
				isValid: false,
				error:
					"Invalid connection string format. It should start with `postgresql://`.",
			};
		}

		// Remove scheme for parsing
		const withoutScheme = uri.substring(schemeMatch[0].length);

		// Find the last @ that separates auth from host
		const lastAtIndex = withoutScheme.lastIndexOf("@");

		let auth = "";
		let hostPart = withoutScheme;

		if (lastAtIndex !== -1) {
			auth = withoutScheme.substring(0, lastAtIndex);
			hostPart = withoutScheme.substring(lastAtIndex + 1);
		}

		// Parse auth
		let user: string | undefined;
		let password: string | undefined;
		if (auth) {
			const colonIndex = auth.indexOf(":");
			if (colonIndex !== -1) {
				user = auth.substring(0, colonIndex);
				password = auth.substring(colonIndex + 1);
			} else {
				user = auth;
			}
		}

		// Parse host part - handle IPv6 addresses in brackets
		let hostMatch: RegExpMatchArray | null = null;
		if (hostPart.startsWith("[")) {
			// IPv6 address
			hostMatch = hostPart.match(
				/^(\[[^\]]+\])(?::([^/?]+))?(?:\/([^?]+))?(?:\?(.+))?$/,
			);
		} else {
			// Regular hostname or IPv4
			hostMatch = hostPart.match(
				/^([^:/?]+)(?::([^/?]+))?(?:\/([^?]+))?(?:\?(.+))?$/,
			);
		}
		if (!hostMatch) {
			return {
				isValid: false,
				error: "Invalid host format in connection string.",
			};
		}

		const port = hostMatch[2];
		const database = hostMatch[3];
		const params = hostMatch[4];

		// Validate port if present
		if (
			port &&
			(Number.isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535)
		) {
			return {
				isValid: false,
				error: `The port '${port}' is not a valid number.`,
			};
		}

		// Check for unencoded special characters in user
		const userValidation = validateURIComponent(user, "username");
		if (!userValidation.isValid) {
			return userValidation;
		}

		// Check for unencoded special characters in password
		const passwordValidation = validateURIComponent(password, "password");
		if (!passwordValidation.isValid) {
			return passwordValidation;
		}

		// Check for unencoded special characters in database name
		const databaseValidation = validateURIComponent(database, "database name");
		if (!databaseValidation.isValid) {
			return databaseValidation;
		}

		// Validate query parameters if present
		if (params) {
			const paramValidation = validateQueryParams(params);
			if (!paramValidation.isValid) {
				return paramValidation;
			}
		}

		return { isValid: true };
	} catch (_error) {
		return {
			isValid: false,
			error: "Invalid connection string format",
		};
	}
}

function validateKeyValueFormat(kvString: string): ValidationResult {
	const pairs = parseKeyValuePairs(kvString);

	if (pairs.length === 0) {
		return {
			isValid: false,
			error: `Invalid format. Expected 'key=value' pairs separated by spaces`,
		};
	}

	for (const { key, value } of pairs) {
		if (!key || !value) {
			return {
				isValid: false,
				error: `Invalid parameter format. Both key and value are required`,
			};
		}

		// Check if the key is recognized
		if (!RECOGNIZED_PARAMS.has(key)) {
			// Find the closest match using fast-levenshtein
			let closestMatch: string | undefined;
			let minDistance = Infinity;
			const threshold = 4; // Increased to handle 'db' -> 'dbname'

			// First check for substring matches
			for (const param of RECOGNIZED_PARAMS) {
				if (param.toLowerCase().includes(key.toLowerCase())) {
					// Prefer shorter matches (e.g., 'db' matches 'dbname' not 'database')
					if (!closestMatch || param.length < closestMatch.length) {
						closestMatch = param;
					}
				}
			}

			// If no substring match, use Levenshtein distance
			if (!closestMatch) {
				for (const param of RECOGNIZED_PARAMS) {
					const distance = levenshtein.get(
						key.toLowerCase(),
						param.toLowerCase(),
					);
					if (distance < minDistance && distance <= threshold) {
						minDistance = distance;
						closestMatch = param;
					}
				}
			}

			if (closestMatch) {
				return {
					isValid: false,
					error: `'${key}' is not a recognized keyword. Did you mean '${closestMatch}'?`,
				};
			}
			return {
				isValid: false,
				error: `'${key}' is not a recognized parameter`,
			};
		}

		// Validate specific parameter values
		if (key === "port") {
			const portNum = Number(value);
			if (Number.isNaN(portNum) || portNum < 1 || portNum > 65535) {
				return {
					isValid: false,
					error: `The port '${value}' is not a valid number.`,
				};
			}
		}

		if (key === "sslmode" && !SSL_MODES.has(value)) {
			return {
				isValid: false,
				error: `Invalid sslmode value '${value}'. Valid values are: ${Array.from(SSL_MODES).join(", ")}`,
			};
		}
	}

	return { isValid: true };
}
