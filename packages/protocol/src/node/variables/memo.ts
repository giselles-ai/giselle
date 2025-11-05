import { z } from "zod/v4";

export const MemoContent = z.object({
	type: z.literal("memo"),
	memo: z.string(),
});
export type MemoContent = z.infer<typeof MemoContent>;

export const CreateMemoNodeParams = MemoContent.omit({
	type: true,
})
	.partial()
	.extend({
		name: z.string(),
	});

export const MemoContentReference = z.object({
	type: MemoContent.shape.type,
});
export type MemoContentReference = z.infer<typeof MemoContentReference>;
