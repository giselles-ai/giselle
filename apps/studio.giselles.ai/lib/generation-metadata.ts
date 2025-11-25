import z from "zod/v4";

export const GenerationMetadata = z.object({
	requestId: z.string().optional(),
	userId: z.string(),
	team: z.object({
		id: z.string<`tm_${string}`>(),
		subscriptionId: z.string().nullable(),
		activeCustomerId: z.string().nullable().optional(),
		plan: z.enum(["free", "pro", "team", "enterprise", "internal"]),
	}),
});
