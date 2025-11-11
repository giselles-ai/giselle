import * as z from "zod/v4";
import { AppId } from "../../app/app";

export const AppEntryType = z.literal("appEntry");

const AppEntryUnconfiguredState = z.object({
	type: AppEntryType,
	status: z.literal("unconfigured"),
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
