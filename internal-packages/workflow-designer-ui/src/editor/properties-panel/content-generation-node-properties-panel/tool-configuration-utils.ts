/**
 * Token input object for creating a new secret
 */
export interface SecretTokenInput {
	token: string;
	label?: string;
}

/**
 * Raw secret configuration value types (for input/output)
 * - string: secretId (existing secret)
 * - SecretTokenInput: new token input object
 */
export type SecretConfigurationValueRaw = string | SecretTokenInput;

/**
 * Secret configuration value as discriminated union
 */
export type SecretConfigurationValue =
	| { type: "secretId"; secretId: string }
	| { type: "tokenInput"; tokenInput: SecretTokenInput };

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

/**
 * Type guard to check if a value is a SecretConfigurationValue
 */
export function isSecretConfigurationValue(
	value: unknown,
): value is SecretConfigurationValue {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	if (!("type" in value)) {
		return false;
	}

	if (value.type === "secretId") {
		return "secretId" in value && typeof value.secretId === "string";
	}

	if (value.type === "tokenInput") {
		return "tokenInput" in value && isSecretTokenInput(value.tokenInput);
	}

	return false;
}

/**
 * Converts a SecretConfigurationValue to raw format for storage
 */
export function toSecretConfigurationValueRaw(
	value: SecretConfigurationValue,
): SecretConfigurationValueRaw {
	switch (value.type) {
		case "secretId":
			return value.secretId;
		case "tokenInput":
			return value.tokenInput;
	}
}
