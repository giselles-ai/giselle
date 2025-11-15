import { Act } from "@giselles-ai/protocol";
import z from "zod/v4";

export const StreamData = z.object({
	act: Act,
});
export type StreamData = z.infer<typeof StreamData>;

const ConnectedEvent = z.object({
	type: z.literal("connected"),
});
const DataEvent = z.object({
	type: z.literal("data"),
	data: StreamData,
});
const EndEvent = z.object({
	type: z.literal("end"),
});
const ErrorEvent = z.object({
	type: z.literal("error"),
	message: z.string(),
});

export const StreamEvent = z.discriminatedUnion("type", [
	ConnectedEvent,
	DataEvent,
	EndEvent,
	ErrorEvent,
]);

export type StreamEvent = z.infer<typeof StreamEvent>;
