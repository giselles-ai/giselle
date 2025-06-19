import type { Storage } from "unstorage";
import { z } from "zod/v4";

export async function addWorkspaceIndexItem<I>(args: {
	storage: Storage;
	indexPath: string;
	item: I;
	itemSchema: z.ZodType<I>;
}) {
	const indexLike = await args.storage.getItem(args.indexPath);
	const parse = z.array(args.itemSchema).safeParse(indexLike);
	const current = parse.success ? parse.data : [];
	const item = args.itemSchema.parse(args.item);
	await args.storage.setItem(args.indexPath, [...current, item]);
}

export async function getWorkspaceIndex<I extends z.ZodObject>(args: {
	storage: Storage;
	indexPath: string;
	itemSchema: I;
}): Promise<z.infer<I>[]> {
	const indexLike = await args.storage.getItem(args.indexPath);
	const parse = z.array(args.itemSchema).safeParse(indexLike);
	return parse.success ? parse.data : [];
}
