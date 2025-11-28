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
> {
	name: TName;
	provider: LanguageModelToolProvider;
	title?: string;
	tools?: never;
	configurationOptions: C;
}

export interface LanguageModelToolWithTools<
	TName extends string = string,
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
> {
	name: TName;
	provider: LanguageModelToolProvider;
	title?: string;
	tools: readonly T[];
	configurationOptions: C;
}

export type LanguageModelTool<
	TName extends string = string,
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
> =
	| LanguageModelToolWithoutTools<TName, C>
	| LanguageModelToolWithTools<TName, C, T>;

export function defineLanguageModelTool<
	TName extends string = string,
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
>(
	languageModelTool: LanguageModelToolWithoutTools<TName, C>,
): LanguageModelToolWithoutTools<TName, C>;
export function defineLanguageModelTool<
	TName extends string = string,
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
>(
	languageModelTool: LanguageModelToolWithTools<TName, C, T>,
): LanguageModelToolWithTools<TName, C, T>;
export function defineLanguageModelTool<
	TName extends string = string,
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
>(languageModelTool: LanguageModelTool<TName, C, T>) {
	return languageModelTool;
}

export function hasTools<
	TName extends string,
	C extends LanguageModelToolConfigurationOptions,
	T extends Tool,
>(
	languageModelTool: LanguageModelTool<TName, C, T>,
): languageModelTool is LanguageModelToolWithTools<TName, C, T> {
	return "tools" in languageModelTool && languageModelTool.tools !== undefined;
}
