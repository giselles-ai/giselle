import { DataStore, type DataStoreId } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { dataStorePath } from "./paths";

export async function deleteDataStore({
	context,
	dataStoreId,
}: {
	context: GiselleContext;
	dataStoreId: DataStoreId;
}): Promise<DataStore> {
	const path = dataStorePath(dataStoreId);

	const exists = await context.storage.exists(path);
	if (!exists) {
		throw new Error(`DataStore not found: ${dataStoreId}`);
	}

	const dataStore = await context.storage.getJson({
		path,
		schema: DataStore,
	});

	await context.storage.remove(path);

	return dataStore;
}
