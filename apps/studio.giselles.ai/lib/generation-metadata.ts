import z from "zod/v4";

export const GenerationMetadata = z.object({
	requestId: z.string().optional(),
	userId: z.string(),
	team: z.object({
		id: z.string<`tm_${string}`>(),
		type: z.enum(["customer", "internal"]),
		subscriptionId: z.string().nullable(),
		plan: z.enum(["free", "pro", "team", "internal"]),
	}),
});
