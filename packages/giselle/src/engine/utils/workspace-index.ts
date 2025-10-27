import { z } from "zod/v4";
import type { GiselleEngineContext } from "../types";

export async function addWorkspaceIndexItem<I>({
	context,
	indexPath,
	item,
	itemSchema,
	useExperimentalStorage = false,
}: {
	context: GiselleEngineContext;
	indexPath: string;
	item: I;
	itemSchema: z.ZodType<I>;
	useExperimentalStorage?: boolean;
}) {
	context.logger.debug(`Adding workspace index item to ${indexPath}`);
	context.logger.debug(`Item: ${JSON.stringify(item)}`);
	context.logger.debug(`useExperimentalStorage: ${useExperimentalStorage}`);
	if (useExperimentalStorage) {
		const exists = await context.storage.exists(indexPath);

		const indexItem = exists
			? await context.storage.getJson({
					path: indexPath,
					schema: z.array(itemSchema),
				})
			: [];
		await context.storage.setJson({
			path: indexPath,
			data: [...indexItem, item],
		});
		return;
	}
	const indexLike = await context.deprecated_storage.getItem(indexPath);
	const parse = z.array(itemSchema).safeParse(indexLike);
	const current = parse.success ? parse.data : [];
	const parsedItem = itemSchema.parse(item);
	await context.deprecated_storage.setItem(indexPath, [...current, parsedItem]);
}

export async function getWorkspaceIndex<I extends z.ZodObject>({
	context,
	indexPath,
	itemSchema,
	useExperimentalStorage = false,
}: {
	context: GiselleEngineContext;
	indexPath: string;
	itemSchema: I;
	useExperimentalStorage?: boolean;
}): Promise<z.infer<I>[]> {
	if (useExperimentalStorage) {
		const hasIndex = await context.storage.exists(indexPath);
		if (!hasIndex) {
			return [];
		}
		return context.storage.getJson({
			path: indexPath,
			schema: z.array(itemSchema),
		});
	}
	const indexLike = await context.deprecated_storage.getItem(indexPath);
	const parse = z.array(itemSchema).safeParse(indexLike);
	return parse.success ? parse.data : [];
}
