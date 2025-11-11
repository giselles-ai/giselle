import { createIdGenerator } from "@giselles-ai/utils";
import * as z from "zod/v4";
import { AppId, AppParameterType } from "../../app";

export const AppEntryType = z.literal("appEntry");

// appprm is an abbreviation for DRaFt APP PaRaMeter
export const DraftAppParameterId = createIdGenerator("drfappprm");
export type DraftAppParameterId = z.infer<typeof DraftAppParameterId.schema>;

export const DraftAppParameter = z.object({
	id: DraftAppParameterId.schema,
	name: z.string(),
	type: AppParameterType,
	required: z.boolean(),
});
export type DraftAppParameter = z.infer<typeof DraftAppParameter>;

export const DraftApp = z.object({
	name: z.string(),
	description: z.string(),
	iconName: z.string(),
	parameters: z.array(DraftAppParameter),
});
export type DraftApp = z.infer<typeof DraftApp>;

const AppEntryUnconfiguredState = z.object({
	type: AppEntryType,
	status: z.literal("unconfigured"),
	draftApp: DraftApp,
});

const AppEntryConfiguredState = z.object({
	type: AppEntryType,
	status: z.literal("configured"),
	appId: AppId.schema,
});

export const AppEntryContent = z.discriminatedUnion("status", [
	AppEntryUnconfiguredState,
	AppEntryConfiguredState,
]);

export const AppEntryContentReference = z.object({
	type: AppEntryType,
});
