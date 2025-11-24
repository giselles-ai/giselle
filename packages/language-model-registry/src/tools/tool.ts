import type { LanguageModelProvider } from "../language-models";

export type ToolConfigurationFieldType =
	| "text"
	| "number"
	| "boolean"
	| "enum"
	| "toolSelection"
	| "tagArray"
	| "object";

export interface BaseToolConfigurationOption {
	name: string;
	title?: string;
	description?: string;
	defaultValue?: unknown;
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

export interface EnumToolConfigurationOption extends BaseToolConfigurationOption {
	type: "enum";
	options: Array<{ value: string; label?: string }>;
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

export type LanguageModelToolConfigurationOption =
	| TextToolConfigurationOption
	| NumberToolConfigurationOption
	| BooleanToolConfigurationOption
	| EnumToolConfigurationOption
	| ToolSelectionToolConfigurationOption
	| TagArrayToolConfigurationOption
	| ObjectToolConfigurationOption;

export type LanguageModelToolConfigurationOptions = Record<
	string,
	LanguageModelToolConfigurationOption
>;

export interface Tool<TName extends string = string> {
	name: TName;
	title?: string;
	description: string;
}
export function defineTool<TName extends string>(tool: Tool<TName>) {
	return tool;
}

export type LanguageModelToolProvider = "giselle" | LanguageModelProvider;

export interface LanguageModelTool<
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
> {
	name: string;
	provider: LanguageModelToolProvider;
	title?: string;
	tools?: readonly T[];
	configurationOptions: C;
}

export function defineLanguageModelTool<
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
>(languageModelTool: LanguageModelTool<C, T>) {
	return languageModelTool;
}
