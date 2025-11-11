import { createIdGenerator } from "@giselles-ai/utils";
import * as z from "zod/v4";

export const AppId = createIdGenerator("app");
export type AppId = z.infer<typeof AppId.schema>;

export const AppParameterType = z.enum(["text", "multiline-text", "number"]);

// appprm is an abbreviation for APP PaRaMeter
export const AppParameterId = createIdGenerator("appprm");

export const AppParameter = z.object({
	id: AppParameterId.schema,
	name: z.string(),
	description: z.string(),
	iconName: z.string(),
	type: AppParameterType,
	required: z.boolean(),
});

export const App = z.object({
	id: AppId,
	name: z.string(),
	parameters: z.array(AppParameter),
});
