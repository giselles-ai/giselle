import type { DataStoreId } from "@giselles-ai/protocol";

export function dataStorePath(dataStoreId: DataStoreId) {
	return `data-stores/${dataStoreId}/data-store.json`;
}
