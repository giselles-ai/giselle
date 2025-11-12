import { createIdGenerator } from "@giselles-ai/utils";
import * as z from "zod/v4";

export const AppId = createIdGenerator("app");
export type AppId = z.infer<typeof AppId.schema>;

export const AppParameterType = z.enum(["text", "multiline-text", "number"]);

// appprm is an abbreviation for APP PaRaMeter
export const AppParameterId = createIdGenerator("appprm");
export type AppParameterId = z.infer<typeof AppParameterId.schema>;

export const AppParameter = z.object({
	id: AppParameterId.schema,
	name: z.string().min(1),
	type: AppParameterType,
	required: z.boolean(),
});
export type AppParameter = z.infer<typeof AppParameter>;

export const App = z.object({
	id: AppId.schema,
	name: z.string().min(1),
	description: z.string(),
	iconName: z.string().min(1),
	parameters: z.array(AppParameter),
});
export type App = z.infer<typeof App>;
