import { DataStore, type DataStoreId } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { dataStorePath } from "./paths";

export async function getDataStore({
	context,
	dataStoreId,
}: {
	context: GiselleContext;
	dataStoreId: DataStoreId;
}): Promise<DataStore | null> {
	const path = dataStorePath(dataStoreId);

	const exists = await context.storage.exists(path);
	if (!exists) {
		return null;
	}

	const dataStore = await context.storage.getJson({
		path,
		schema: DataStore,
	});

	return dataStore;
}
