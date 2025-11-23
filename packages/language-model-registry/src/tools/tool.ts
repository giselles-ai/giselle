import type z from "zod/v4";
import type { LanguageModelProvider } from "../language-models";

interface LanguageModelToolConfigurationOption<TSchema extends z.ZodType> {
	name: string;
	title?: string;
	schema: TSchema;
}

export type LanguageModelToolConfigurationOptions = Record<
	string,
	LanguageModelToolConfigurationOption<z.ZodType>
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
	tools: T[];
	configurationOptions: C;
}

export function defineLanguageModelTool<
	C extends
		LanguageModelToolConfigurationOptions = LanguageModelToolConfigurationOptions,
	T extends Tool = Tool,
>(languageModelTool: LanguageModelTool<C, T>) {
	return languageModelTool;
}
