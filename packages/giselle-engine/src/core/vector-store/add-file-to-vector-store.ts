import type { GiselleEngineContext } from "../types";
import type { VectorStoreId } from "./types/object";

/** @todo */
export function addFileToVectorStore(args: {
	context: GiselleEngineContext;
	vectorStoreId: VectorStoreId;
	file: File;
}) {
	const vectorStore = args.context.vectorStore;
	if (vectorStore === undefined) {
		throw new Error("VectorStore is not initialized");
	}
	// await vectorStore.addFile({
	// 	vectorStoreId: args.vectorStoreId,
	// 	file: args.file,
	// });
}
