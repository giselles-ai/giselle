import type * as z from "zod/v4";
import type { LanguageModelProvider } from "../language-models";

export type ToolConfigurationFieldType =
	| "text"
	| "number"
	| "boolean"
	| "enum"
	| "toolSelection"
	| "tagArray"
	| "object"
	| "secret";

export interface BaseToolConfigurationOption {
	name: string;
	title?: string;
	description?: string;
	defaultValue?: unknown;
	optional?: boolean;
	schema?: z.ZodType;
}

export interface TextToolConfigurationOption
	extends BaseToolConfigurationOption {
	type: "text";
	placeholder?: string;
}

export interface NumberToolConfigurationOption
	extends BaseToolConfigurationOption {
	type: "number";
	min?: number;
	max?: number;
	step?: number;
}

export interface BooleanToolConfigurationOption
	extends BaseToolConfigurationOption {
	type: "boolean";
}

export interface EnumToolConfigurationOption
	extends BaseToolConfigurationOption {
	type: "enum";
	options: Array<{ value: string; label?: string }>;
	valueType?: "string" | "number";
}

export interface ToolSelectionToolConfigurationOption
	extends BaseToolConfigurationOption {
	type: "toolSelection";
}

export interface TagArrayToolConfigurationOption
	extends BaseToolConfigurationOption {
	type: "tagArray";
	placeholder?: string;
	validate?: (value: string) => { isValid: boolean; message?: string };
}

export interface ObjectToolConfigurationOption
	extends BaseToolConfigurationOption {
	type: "object";
}

export interface SecretToolConfigurationOption
	extends BaseToolConfigurationOption {
	type: "secret";
	secretTags: string[];
}

export type LanguageModelToolConfigurationOption =
	| TextToolConfigurationOption
	| NumberToolConfigurationOption
	| BooleanToolConfigurationOption
	| EnumToolConfigurationOption
	| ToolSelectionToolConfigurationOption
	| TagArrayToolConfigurationOption
	| ObjectToolConfigurationOption
	| SecretToolConfigurationOption;

export type LanguageModelToolConfigurationOptions = Record<
	string,
	LanguageModelToolConfigurationOption
>;

export interface ToolWithoutSchema<TName extends string = string> {
	name: TName;
	title?: string;
	description: string;
	schema?: never;
}

export interface ToolWithSchema<
	TName extends string = string,
	Schema extends z.ZodType = z.ZodType,
> {
	name: TName;
	title?: string;
	description: string;
	schema: Schema;
}

export type Tool<
	TName extends string = string,
	Schema extends z.ZodType = z.ZodType,
> = ToolWithoutSchema<TName> | ToolWithSchema<TName, Schema>;

export function defineTool<TName extends string>(
	tool: ToolWithoutSchema<TName>,
): ToolWithoutSchema<TName>;
export function defineTool<TName extends string, Schema extends z.ZodType>(
	tool: ToolWithSchema<TName, Schema>,
): ToolWithSchema<TName, Schema>;
export function defineTool<
	TName extends string,
	Schema extends z.ZodType = z.ZodType,
>(tool: Tool<TName, Schema>) {
	return tool;
}

export function hasSchema<T extends Tool>(
	tool: T,
): tool is T & ToolWithSchema<T["name"], z.ZodType> {
	return "schema" in tool && tool.schema !== undefined;
}

export type LanguageModelToolProvider = "giselle" | LanguageModelProvider;

export interface LanguageModelToolWithoutTools<
	TName extends string = string,
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	Schema extends z.ZodType = z.ZodType,
> {
	name: TName;
	provider: LanguageModelToolProvider;
	title?: string;
	tools?: never;
	configurationOptions: C;
	configurationSchema?: Schema;
}

export interface LanguageModelToolWithTools<
	TName extends string = string,
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
	Schema extends z.ZodType = z.ZodType,
> {
	name: TName;
	provider: LanguageModelToolProvider;
	title?: string;
	tools: readonly T[];
	configurationOptions: C;
	configurationSchema?: Schema;
}

export type LanguageModelTool<
	TName extends string = string,
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
	Schema extends z.ZodType = z.ZodType,
> =
	| LanguageModelToolWithoutTools<TName, C, Schema>
	| LanguageModelToolWithTools<TName, C, T, Schema>;

export function defineLanguageModelTool<
	TName extends string = string,
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	Schema extends z.ZodType = z.ZodType,
>(
	languageModelTool: LanguageModelToolWithoutTools<TName, C, Schema>,
): LanguageModelToolWithoutTools<TName, C, Schema>;
export function defineLanguageModelTool<
	TName extends string = string,
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
	Schema extends z.ZodType = z.ZodType,
>(
	languageModelTool: LanguageModelToolWithTools<TName, C, T, Schema>,
): LanguageModelToolWithTools<TName, C, T, Schema>;
export function defineLanguageModelTool<
	TName extends string = string,
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
	Schema extends z.ZodType = z.ZodType,
>(languageModelTool: LanguageModelTool<TName, C, T, Schema>) {
	return languageModelTool;
}

export function hasTools<
	TName extends string,
	C extends LanguageModelToolConfigurationOptions,
	T extends Tool,
	Schema extends z.ZodType = z.ZodType,
>(
	languageModelTool: LanguageModelTool<TName, C, T, Schema>,
): languageModelTool is LanguageModelToolWithTools<TName, C, T, Schema> {
	return "tools" in languageModelTool && languageModelTool.tools !== undefined;
}

export function hasConfigurationSchema<
	TName extends string,
	C extends LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
	Schema extends z.ZodType = z.ZodType,
>(
	languageModelTool: LanguageModelTool<TName, C, T, Schema>,
): languageModelTool is LanguageModelTool<TName, C, T, Schema> & {
	configurationSchema: Schema;
} {
	if (
		"configurationSchema" in languageModelTool &&
		languageModelTool.configurationSchema !== undefined
	) {
		return true;
	}
	// Check if all options have schema
	return Object.values(languageModelTool.configurationOptions).every(
		(option) => option.schema !== undefined,
	);
}
