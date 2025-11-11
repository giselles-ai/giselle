import * as z from "zod/v4";

export const AppEntryType = z.literal("appEntry");

const AppEntryUnconfiguredState = z.object({
	type: AppEntryType,
	status: z.literal("unconfigured"),
});

const AppEntryConfiguredState = z.object({
	type: AppEntryType,
	status: z.literal("configured"),
});

export const AppEntryContent = z.discriminatedUnion("status", [
	AppEntryUnconfiguredState,
	AppEntryConfiguredState,
]);

export const AppEntryContentReference = z.object({
	type: AppEntryType,
});
