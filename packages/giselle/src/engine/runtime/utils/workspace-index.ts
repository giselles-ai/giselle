import * as z from "zod/v4";
import type { GiselleEngineContext } from "../../contracts";

export async function addWorkspaceIndexItem<I>({
	context,
	indexPath,
	item,
	itemSchema,
}: {
	context: GiselleEngineContext;
	indexPath: string;
	item: I;
	itemSchema: z.ZodType<I>;
}) {
	context.logger.debug(`Adding workspace index item to ${indexPath}`);
	context.logger.debug(`Item: ${JSON.stringify(item)}`);
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

export async function getWorkspaceIndex<I extends z.ZodObject>({
	context,
	indexPath,
	itemSchema,
}: {
	context: GiselleEngineContext;
	indexPath: string;
	itemSchema: I;
}): Promise<z.infer<I>[]> {
	const hasIndex = await context.storage.exists(indexPath);
	if (!hasIndex) {
		return [];
	}
	return context.storage.getJson({
		path: indexPath,
		schema: z.array(itemSchema),
	});
}
