import { createIdGenerator } from "@giselles-ai/utils";
import * as z from "zod/v4";
import { NodeId } from "../node/base";
import { WorkspaceId } from "../workspace/id";
import { AppId } from "./app-id";

export const AppParameterType = z.enum([
	"text",
	"multiline-text",
	"number",
	"files",
]);

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
	entryNodeId: NodeId.schema,
	workspaceId: WorkspaceId.schema,
});
export type App = z.infer<typeof App>;
