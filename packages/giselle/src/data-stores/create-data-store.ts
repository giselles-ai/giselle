import {
	type DataStoreProvider,
	parseConfiguration,
} from "@giselles-ai/data-store-registry";
import { DataStore, DataStoreId } from "@giselles-ai/protocol";
import type { GiselleContext } from "../types";
import { dataStorePath } from "./paths";

export async function createDataStore({
	context,
	provider,
	configuration,
}: {
	context: GiselleContext;
	provider: DataStoreProvider;
	configuration: DataStore["configuration"];
}): Promise<DataStore> {
	const validatedConfiguration = parseConfiguration(provider, configuration);
	const dataStoreId = DataStoreId.generate();
	const dataStore: DataStore = {
		id: dataStoreId,
		provider,
		configuration: validatedConfiguration,
	};

	await context.storage.setJson({
		path: dataStorePath(dataStoreId),
		data: dataStore,
		schema: DataStore,
	});

	return dataStore;
}
