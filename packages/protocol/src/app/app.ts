import { createIdGenerator } from "@giselles-ai/utils";
import * as z from "zod/v4";
import { ApiKeyId } from "../api-publishing/api-secret";
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
	name: z.string(),
	type: AppParameterType,
	required: z.boolean(),
});
export type AppParameter = z.infer<typeof AppParameter>;

export const ApiPublishingSettings = z.object({
	isEnabled: z.boolean(),
	apiKeyId: ApiKeyId.schema.optional(),
});
export type ApiPublishingSettings = z.infer<typeof ApiPublishingSettings>;

export const DisconnectedApp = z.object({
	id: AppId.schema,
	version: z.literal("v1"),
	state: z.literal("disconnected"),
	description: z.string(),
	parameters: z.array(AppParameter),
	entryNodeId: NodeId.schema,
	workspaceId: WorkspaceId.schema,
	apiPublishing: ApiPublishingSettings.optional(),
});
export type DisconnectedApp = z.infer<typeof DisconnectedApp>;

export const ConnectedApp = z.object({
	id: AppId.schema,
	version: z.literal("v1"),
	state: z.literal("connected"),
	description: z.string(),
	parameters: z.array(AppParameter),
	entryNodeId: NodeId.schema,
	endNodeId: NodeId.schema,
	workspaceId: WorkspaceId.schema,
	apiPublishing: ApiPublishingSettings.optional(),
});
export type ConnectedApp = z.infer<typeof ConnectedApp>;

function coerceDeprecatedAppToApp(input: DeprecatedApp): DisconnectedApp {
	return {
		id: input.id,
		version: "v1",
		state: "disconnected",
		description: input.description,
		parameters: input.parameters,
		entryNodeId: input.entryNodeId,
		workspaceId: input.workspaceId,
	};
}

export const App = z.preprocess(
	(input) => {
		const deprecatedParseResult = DeprecatedApp.safeParse(input);
		if (deprecatedParseResult.success) {
			return coerceDeprecatedAppToApp(deprecatedParseResult.data);
		}
		return input;
	},
	z.discriminatedUnion("state", [DisconnectedApp, ConnectedApp]),
);
export type App = z.infer<typeof App>;

/** @deprecated use App */
export const DeprecatedApp = z.object({
	id: AppId.schema,
	/**
	 * @deprecated The relationship between app and workspace is now 1:1,
	 * and the Workspace name becomes the App name, so this should not be referenced
	 */
	name: z.string(),
	description: z.string(),
	iconName: z.string().min(1),
	parameters: z.array(AppParameter),
	entryNodeId: NodeId.schema,
	workspaceId: WorkspaceId.schema,
});
export type DeprecatedApp = z.infer<typeof DeprecatedApp>;
