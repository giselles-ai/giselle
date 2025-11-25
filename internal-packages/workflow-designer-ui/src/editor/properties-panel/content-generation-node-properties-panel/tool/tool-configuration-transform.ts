import type { LanguageModelTool } from "@giselles-ai/language-model-registry";

/**
 * Applies default values to configuration for optional fields that are not set
 */
export function applyDefaultValues(
	tool: LanguageModelTool,
	config: Record<string, unknown>,
): Record<string, unknown> {
	const processedConfig: Record<string, unknown> = { ...config };
	for (const [key, option] of Object.entries(tool.configurationOptions)) {
		if (
			processedConfig[key] === undefined &&
			option.defaultValue !== undefined
		) {
			processedConfig[key] = option.defaultValue;
		}
	}
	return processedConfig;
}

/**
 * Transforms configuration values to match content-generation.ts schema
 * - enum values → strings (default) or numbers (if valueType === "number")
 * - number values → numbers
 * - boolean values → booleans
 * - other types (text, tagArray, object, secret, toolSelection) → as-is
 * - undefined/null values for optional fields are skipped
 */
export function transformConfigurationValues(
	tool: LanguageModelTool,
	config: Record<string, unknown>,
): Record<string, unknown> {
	const transformedConfig: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(config)) {
		const option = tool.configurationOptions[key];
		if (value === undefined || value === null) {
			// Skip undefined/null values for optional fields
			if (!option.optional) {
				// Required field is missing, but validation should have caught this
				continue;
			}
			continue;
		}

		// Transform enum values to strings or numbers based on valueType
		if (option.type === "enum") {
			if (option.valueType === "number") {
				transformedConfig[key] = Number(value);
			} else {
				transformedConfig[key] = String(value);
			}
		}
		// Transform number values
		else if (option.type === "number") {
			transformedConfig[key] = Number(value);
		}
		// Transform boolean values
		else if (option.type === "boolean") {
			transformedConfig[key] = Boolean(value);
		}
		// Keep other types as-is (text, tagArray, object, secret, toolSelection)
		else {
			transformedConfig[key] = value;
		}
	}
	return transformedConfig;
}
