import * as z from "zod/v4";
import { App, AppId } from "../../app";

export const AppEntryType = z.literal("appEntry");

export const DraftApp = App.omit({
	id: true,
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
