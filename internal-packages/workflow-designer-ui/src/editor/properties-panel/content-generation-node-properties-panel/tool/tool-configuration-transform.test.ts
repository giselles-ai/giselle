import type {
	LanguageModelTool,
	LanguageModelToolConfigurationOption,
} from "@giselles-ai/language-model-registry";
import { describe, expect, it } from "vitest";
import {
	applyDefaultValues,
	transformConfigurationValues,
} from "./tool-configuration-transform";

// Helper to create a mock tool
function createMockTool(
	configurationOptions: Record<string, LanguageModelToolConfigurationOption>,
): LanguageModelTool {
	return {
		name: "test-tool",
		provider: "giselle",
		title: "Test Tool",
		configurationOptions,
	};
}

describe("applyDefaultValues", () => {
	it("should apply default values for undefined optional fields", () => {
		const tool = createMockTool({
			optionalText: {
				name: "optionalText",
				type: "text",
				optional: true,
				defaultValue: "default-text",
			},
			optionalNumber: {
				name: "optionalNumber",
				type: "number",
				optional: true,
				defaultValue: 42,
			},
			requiredText: {
				name: "requiredText",
				type: "text",
				optional: false,
			},
		});

		const config = {
			requiredText: "provided-value",
		};

		const result = applyDefaultValues(tool, config);

		expect(result.optionalText).toBe("default-text");
		expect(result.optionalNumber).toBe(42);
		expect(result.requiredText).toBe("provided-value");
	});

	it("should not override existing values with defaults", () => {
		const tool = createMockTool({
			optionalText: {
				name: "optionalText",
				type: "text",
				optional: true,
				defaultValue: "default-text",
			},
		});

		const config = {
			optionalText: "custom-value",
		};

		const result = applyDefaultValues(tool, config);

		expect(result.optionalText).toBe("custom-value");
	});

	it("should handle empty config", () => {
		const tool = createMockTool({
			optionalText: {
				name: "optionalText",
				type: "text",
				optional: true,
				defaultValue: "default-text",
			},
		});

		const config = {};

		const result = applyDefaultValues(tool, config);

		expect(result.optionalText).toBe("default-text");
	});

	it("should handle null values correctly", () => {
		const tool = createMockTool({
			optionalText: {
				name: "optionalText",
				type: "text",
				optional: true,
				defaultValue: "default-text",
			},
		});

		const config = {
			optionalText: null,
		};

		const result = applyDefaultValues(tool, config);

		// null should not be replaced with default
		expect(result.optionalText).toBeNull();
	});
});

describe("transformConfigurationValues", () => {
	describe("enum transformation", () => {
		it("should convert enum values to strings", () => {
			const tool = createMockTool({
				maxUses: {
					name: "maxUses",
					type: "enum",
					options: [
						{ value: "1", label: "1" },
						{ value: "2", label: "2" },
					],
				},
			});

			const config = {
				maxUses: "1",
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.maxUses).toBe("1");
			expect(typeof result.maxUses).toBe("string");
		});

		it("should convert numeric enum values to strings", () => {
			const tool = createMockTool({
				maxUses: {
					name: "maxUses",
					type: "enum",
					options: [
						{ value: "1", label: "1" },
						{ value: "2", label: "2" },
					],
				},
			});

			const config = {
				maxUses: 1, // number input
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.maxUses).toBe("1");
			expect(typeof result.maxUses).toBe("string");
		});

		it("should convert enum values to numbers when valueType is number", () => {
			const tool = createMockTool({
				maxUses: {
					name: "maxUses",
					type: "enum",
					valueType: "number",
					options: [
						{ value: "1", label: "1" },
						{ value: "2", label: "2" },
					],
				},
			});

			const config = {
				maxUses: "1",
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.maxUses).toBe(1);
			expect(typeof result.maxUses).toBe("number");
		});

		it("should convert numeric enum values to numbers when valueType is number", () => {
			const tool = createMockTool({
				maxUses: {
					name: "maxUses",
					type: "enum",
					valueType: "number",
					options: [
						{ value: "1", label: "1" },
						{ value: "2", label: "2" },
					],
				},
			});

			const config = {
				maxUses: 1, // number input
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.maxUses).toBe(1);
			expect(typeof result.maxUses).toBe("number");
		});

		it("should default to string when valueType is not specified", () => {
			const tool = createMockTool({
				maxUses: {
					name: "maxUses",
					type: "enum",
					// valueType not specified, should default to string
					options: [
						{ value: "1", label: "1" },
						{ value: "2", label: "2" },
					],
				},
			});

			const config = {
				maxUses: "1",
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.maxUses).toBe("1");
			expect(typeof result.maxUses).toBe("string");
		});
	});

	describe("number transformation", () => {
		it("should convert string numbers to numbers", () => {
			const tool = createMockTool({
				timeout: {
					name: "timeout",
					type: "number",
					min: 0,
					max: 100,
				},
			});

			const config = {
				timeout: "42",
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.timeout).toBe(42);
			expect(typeof result.timeout).toBe("number");
		});

		it("should keep numeric values as numbers", () => {
			const tool = createMockTool({
				timeout: {
					name: "timeout",
					type: "number",
					min: 0,
					max: 100,
				},
			});

			const config = {
				timeout: 42,
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.timeout).toBe(42);
			expect(typeof result.timeout).toBe("number");
		});

		it("should handle float numbers", () => {
			const tool = createMockTool({
				ratio: {
					name: "ratio",
					type: "number",
					step: 0.1,
				},
			});

			const config = {
				ratio: "0.5",
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.ratio).toBe(0.5);
			expect(typeof result.ratio).toBe("number");
		});
	});

	describe("boolean transformation", () => {
		it("should convert truthy values to true", () => {
			const tool = createMockTool({
				enabled: {
					name: "enabled",
					type: "boolean",
				},
			});

			const config = {
				enabled: true,
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.enabled).toBe(true);
			expect(typeof result.enabled).toBe("boolean");
		});

		it("should convert falsy values to false", () => {
			const tool = createMockTool({
				enabled: {
					name: "enabled",
					type: "boolean",
				},
			});

			const config = {
				enabled: false,
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.enabled).toBe(false);
			expect(typeof result.enabled).toBe("boolean");
		});

		it("should convert string 'true' to boolean true", () => {
			const tool = createMockTool({
				enabled: {
					name: "enabled",
					type: "boolean",
				},
			});

			const config = {
				enabled: "true",
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.enabled).toBe(true);
			expect(typeof result.enabled).toBe("boolean");
		});
	});

	describe("text transformation", () => {
		it("should keep text values as-is", () => {
			const tool = createMockTool({
				apiKey: {
					name: "apiKey",
					type: "text",
				},
			});

			const config = {
				apiKey: "my-api-key",
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.apiKey).toBe("my-api-key");
			expect(typeof result.apiKey).toBe("string");
		});
	});

	describe("tagArray transformation", () => {
		it("should keep tagArray values as-is", () => {
			const tool = createMockTool({
				allowedDomains: {
					name: "allowedDomains",
					type: "tagArray",
					placeholder: "Domain Names",
				},
			});

			const config = {
				allowedDomains: ["example.com", "test.com"],
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.allowedDomains).toEqual(["example.com", "test.com"]);
			expect(Array.isArray(result.allowedDomains)).toBe(true);
		});
	});

	describe("object transformation", () => {
		it("should keep object values as-is", () => {
			const tool = createMockTool({
				userLocation: {
					name: "userLocation",
					type: "object",
				},
			});

			const config = {
				userLocation: { lat: 35.6762, lng: 139.6503 },
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.userLocation).toEqual({ lat: 35.6762, lng: 139.6503 });
			expect(typeof result.userLocation).toBe("object");
		});
	});

	describe("secret transformation", () => {
		it("should keep secret ID strings as-is", () => {
			const tool = createMockTool({
				secretId: {
					name: "secretId",
					type: "secret",
					secretTags: ["github-access-token"],
				},
			});

			const config = {
				secretId: "secret-123",
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.secretId).toBe("secret-123");
			expect(typeof result.secretId).toBe("string");
		});

		it("should keep token objects as-is (before secret creation)", () => {
			const tool = createMockTool({
				secretId: {
					name: "secretId",
					type: "secret",
					secretTags: ["github-access-token"],
				},
			});

			const config = {
				secretId: { token: "ghp_token123", label: "My Token" },
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.secretId).toEqual({
				token: "ghp_token123",
				label: "My Token",
			});
		});
	});

	describe("toolSelection transformation", () => {
		it("should keep toolSelection arrays as-is", () => {
			const tool = createMockTool({
				useTools: {
					name: "useTools",
					type: "toolSelection",
				},
			});

			const config = {
				useTools: ["addIssueComment", "createPullRequest"],
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.useTools).toEqual(["addIssueComment", "createPullRequest"]);
			expect(Array.isArray(result.useTools)).toBe(true);
		});
	});

	describe("optional fields", () => {
		it("should skip undefined optional fields", () => {
			const tool = createMockTool({
				optionalText: {
					name: "optionalText",
					type: "text",
					optional: true,
				},
				requiredText: {
					name: "requiredText",
					type: "text",
					optional: false,
				},
			});

			const config = {
				requiredText: "value",
				optionalText: undefined,
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.optionalText).toBeUndefined();
			expect(result.requiredText).toBe("value");
		});

		it("should skip null optional fields", () => {
			const tool = createMockTool({
				optionalText: {
					name: "optionalText",
					type: "text",
					optional: true,
				},
			});

			const config = {
				optionalText: null,
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.optionalText).toBeUndefined();
		});

		it("should include null required fields (validation should catch this)", () => {
			const tool = createMockTool({
				requiredText: {
					name: "requiredText",
					type: "text",
					optional: false,
				},
			});

			const config = {
				requiredText: null,
			};

			const result = transformConfigurationValues(tool, config);

			// null required fields are skipped (validation should catch this)
			expect(result.requiredText).toBeUndefined();
		});
	});

	describe("complex scenarios", () => {
		it("should handle mixed configuration types", () => {
			const tool = createMockTool({
				apiKey: {
					name: "apiKey",
					type: "text",
				},
				maxUses: {
					name: "maxUses",
					type: "enum",
					options: [
						{ value: "1", label: "1" },
						{ value: "2", label: "2" },
					],
				},
				timeout: {
					name: "timeout",
					type: "number",
				},
				enabled: {
					name: "enabled",
					type: "boolean",
				},
				allowedDomains: {
					name: "allowedDomains",
					type: "tagArray",
				},
			});

			const config = {
				apiKey: "my-key",
				maxUses: 1,
				timeout: "30",
				enabled: true,
				allowedDomains: ["example.com"],
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.apiKey).toBe("my-key");
			expect(result.maxUses).toBe("1");
			expect(result.timeout).toBe(30);
			expect(result.enabled).toBe(true);
			expect(result.allowedDomains).toEqual(["example.com"]);
		});

		it("should handle GitHub API tool configuration", () => {
			const tool = createMockTool({
				secretId: {
					name: "secretId",
					type: "secret",
					secretTags: ["github-access-token"],
				},
				useTools: {
					name: "useTools",
					type: "toolSelection",
				},
			});

			const config = {
				secretId: "secret-123",
				useTools: ["addIssueComment", "createPullRequest"],
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.secretId).toBe("secret-123");
			expect(result.useTools).toEqual(["addIssueComment", "createPullRequest"]);
		});

		it("should handle Anthropic Web Search tool configuration", () => {
			const tool = createMockTool({
				maxUses: {
					name: "maxUses",
					type: "enum",
					optional: true,
					options: [
						{ value: "1", label: "1" },
						{ value: "2", label: "2" },
					],
				},
				allowedDomains: {
					name: "allowedDomains",
					type: "tagArray",
					optional: true,
				},
				blockedDomains: {
					name: "blockedDomains",
					type: "tagArray",
					optional: true,
				},
			});

			const config = {
				maxUses: "2",
				allowedDomains: ["example.com", "test.com"],
			};

			const result = transformConfigurationValues(tool, config);

			expect(result.maxUses).toBe("2");
			expect(result.allowedDomains).toEqual(["example.com", "test.com"]);
			expect(result.blockedDomains).toBeUndefined();
		});
	});
});
