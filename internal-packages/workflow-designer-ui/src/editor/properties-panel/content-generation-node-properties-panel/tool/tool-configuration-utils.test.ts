import { describe, expect, it } from "vitest";
import {
	isSecretTokenInput,
	parseSecretConfigurationValue,
	parseSecretTokenInput,
	type SecretTokenInput,
} from "./tool-configuration-utils";

describe("isSecretTokenInput", () => {
	it("should return true for valid SecretTokenInput with token only", () => {
		const value: SecretTokenInput = {
			token: "ghp_token123",
		};

		expect(isSecretTokenInput(value)).toBe(true);
	});

	it("should return true for valid SecretTokenInput with token and label", () => {
		const value: SecretTokenInput = {
			token: "ghp_token123",
			label: "My Token",
		};

		expect(isSecretTokenInput(value)).toBe(true);
	});

	it("should return false for string value", () => {
		const value = "secret-123";

		expect(isSecretTokenInput(value)).toBe(false);
	});

	it("should return false for null", () => {
		expect(isSecretTokenInput(null)).toBe(false);
	});

	it("should return false for undefined", () => {
		expect(isSecretTokenInput(undefined)).toBe(false);
	});

	it("should return false for object without token", () => {
		const value = {
			label: "My Token",
		};

		expect(isSecretTokenInput(value)).toBe(false);
	});

	it("should return false for object with non-string token", () => {
		const value = {
			token: 123,
		};

		expect(isSecretTokenInput(value)).toBe(false);
	});

	it("should return false for object with non-string label", () => {
		const value = {
			token: "ghp_token123",
			label: 123,
		};

		expect(isSecretTokenInput(value)).toBe(false);
	});

	it("should return true for object with empty string token", () => {
		const value = {
			token: "",
		};

		expect(isSecretTokenInput(value)).toBe(true);
	});
});

describe("parseSecretTokenInput", () => {
	it("should parse valid SecretTokenInput with token only", () => {
		const value: SecretTokenInput = {
			token: "ghp_token123",
		};

		const result = parseSecretTokenInput(value);

		expect(result).toEqual({
			token: "ghp_token123",
		});
	});

	it("should parse valid SecretTokenInput with token and label", () => {
		const value: SecretTokenInput = {
			token: "ghp_token123",
			label: "My Token",
		};

		const result = parseSecretTokenInput(value);

		expect(result).toEqual({
			token: "ghp_token123",
			label: "My Token",
		});
	});

	it("should return undefined for string value", () => {
		const value = "secret-123";

		const result = parseSecretTokenInput(value);

		expect(result).toBeUndefined();
	});

	it("should return undefined for null", () => {
		const result = parseSecretTokenInput(null);

		expect(result).toBeUndefined();
	});

	it("should return undefined for undefined", () => {
		const result = parseSecretTokenInput(undefined);

		expect(result).toBeUndefined();
	});

	it("should return undefined for invalid object", () => {
		const value = {
			label: "My Token",
		};

		const result = parseSecretTokenInput(value);

		expect(result).toBeUndefined();
	});

	it("should exclude label if it is empty string", () => {
		const value = {
			token: "ghp_token123",
			label: "",
		};

		const result = parseSecretTokenInput(value);

		expect(result).toEqual({
			token: "ghp_token123",
		});
	});

	it("should exclude label if it is undefined", () => {
		const value = {
			token: "ghp_token123",
			label: undefined,
		};

		const result = parseSecretTokenInput(value);

		expect(result).toEqual({
			token: "ghp_token123",
		});
	});
});

describe("parseSecretConfigurationValue", () => {
	it("should parse string value as secretId", () => {
		const value = "secret-123";

		const result = parseSecretConfigurationValue(value);

		expect(result).toEqual({
			type: "secretId",
			secretId: "secret-123",
		});
	});

	it("should parse SecretTokenInput as tokenInput", () => {
		const value: SecretTokenInput = {
			token: "ghp_token123",
			label: "My Token",
		};

		const result = parseSecretConfigurationValue(value);

		expect(result).toEqual({
			type: "tokenInput",
			tokenInput: {
				token: "ghp_token123",
				label: "My Token",
			},
		});
	});

	it("should parse SecretTokenInput without label as tokenInput", () => {
		const value: SecretTokenInput = {
			token: "ghp_token123",
		};

		const result = parseSecretConfigurationValue(value);

		expect(result).toEqual({
			type: "tokenInput",
			tokenInput: {
				token: "ghp_token123",
			},
		});
	});

	it("should return null for invalid value", () => {
		const value = {
			invalid: "value",
		};

		const result = parseSecretConfigurationValue(value);

		expect(result).toBeNull();
	});

	it("should return null for null", () => {
		const result = parseSecretConfigurationValue(null);

		expect(result).toBeNull();
	});

	it("should return null for undefined", () => {
		const result = parseSecretConfigurationValue(undefined);

		expect(result).toBeNull();
	});
});
