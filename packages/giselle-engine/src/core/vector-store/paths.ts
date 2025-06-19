import type { VectorStoreId } from "./types/object";

export function vectorStorePath(vectorStoreId: VectorStoreId) {
	return `vectorStores/${vectorStoreId}/object.json`;
}
