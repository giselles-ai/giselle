import z from "zod/v4";

export const ActionCommandBase = z.object({
	id: z.string(),
});

export const ActionBase = z.object({
	provider: z.string(),
	command: ActionCommandBase,
});
export type ActionBase = z.infer<typeof ActionBase>;
