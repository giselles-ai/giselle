import { describe, expect, it } from "vitest";
import {
	getProviderDefinition,
	isDataStoreProvider,
	parseConfiguration,
} from "./index";

describe("isDataStoreProvider", () => {
	it("should return true for valid provider", () => {
		expect(isDataStoreProvider("postgres")).toBe(true);
	});

	it("should return false for invalid provider string", () => {
		expect(isDataStoreProvider("mysql")).toBe(false);
		expect(isDataStoreProvider("")).toBe(false);
	});

	it("should return false for non-string values", () => {
		expect(isDataStoreProvider(123)).toBe(false);
		expect(isDataStoreProvider(null)).toBe(false);
		expect(isDataStoreProvider(undefined)).toBe(false);
		expect(isDataStoreProvider({})).toBe(false);
		expect(isDataStoreProvider([])).toBe(false);
	});
});

describe("getProviderDefinition", () => {
	it("should return definition for valid provider", () => {
		const def = getProviderDefinition("postgres");

		expect(def.provider).toBe("postgres");
		expect(def.label).toBe("PostgreSQL");
		expect(def.configurationSchema).toBeDefined();
	});

	it("should throw for unknown provider", () => {
		expect(() => getProviderDefinition("mysql" as "postgres")).toThrow(
			"Unknown data store provider: mysql",
		);
	});
});

describe("parseConfiguration", () => {
	describe("with postgres provider", () => {
		it("should parse valid configuration", () => {
			const config = {
				connectionStringSecretId: "secret_123",
			};

			const result = parseConfiguration("postgres", config);

			expect(result.connectionStringSecretId).toBe("secret_123");
		});

		it("should throw when connectionStringSecretId is missing", () => {
			const config = {};

			expect(() => parseConfiguration("postgres", config)).toThrow();
		});

		it("should throw when connectionStringSecretId is empty", () => {
			const config = {
				connectionStringSecretId: "",
			};

			expect(() => parseConfiguration("postgres", config)).toThrow();
		});

		it("should throw when connectionStringSecretId is not a string", () => {
			const config = {
				connectionStringSecretId: 123,
			};

			expect(() => parseConfiguration("postgres", config)).toThrow();
		});

		it("should ignore unknown keys", () => {
			const config = {
				connectionStringSecretId: "secret_123",
				unknownKey: "should be ignored",
			};

			const result = parseConfiguration("postgres", config);

			expect(result.connectionStringSecretId).toBe("secret_123");
			expect("unknownKey" in result).toBe(false);
		});
	});
});
