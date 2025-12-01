/**
 * Token input object for creating a new secret
 */
export interface SecretTokenInput {
	token: string;
	label?: string;
}

/**
 * Type guard to check if a value is a SecretTokenInput object
 */
export function isSecretTokenInput(value: unknown): value is SecretTokenInput {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	if (!("token" in value) || typeof value.token !== "string") {
		return false;
	}

	// label is optional, but if present must be a string
	if (
		"label" in value &&
		typeof value.label !== "string" &&
		value.label !== undefined
	) {
		return false;
	}

	return true;
}

/**
 * Parses a secret configuration value into a SecretTokenInput or undefined
 */
export function parseSecretTokenInput(
	value: unknown,
): SecretTokenInput | undefined {
	if (!isSecretTokenInput(value)) {
		return undefined;
	}

	return {
		token: value.token,
		...(value.label && { label: value.label }),
	};
}

/**
 * Parses a raw secret configuration value into a discriminated union
 */
export function parseSecretConfigurationValue(
	value: unknown,
): SecretConfigurationValue | null {
	if (typeof value === "string") {
		return { type: "secretId", secretId: value };
	}

	if (isSecretTokenInput(value)) {
		return {
			type: "tokenInput",
			tokenInput: {
				token: value.token,
				...(value.label && { label: value.label }),
			},
		};
	}

	return null;
}
