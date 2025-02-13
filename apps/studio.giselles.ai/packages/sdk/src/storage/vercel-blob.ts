import { put } from "@vercel/blob";
import type { StorageClient } from "./types";

export function createVercelBlobStorageClient(): StorageClient {
	if (process.env.BLOB_READ_WRITE_TOKEN === undefined) {
		throw new Error("BLOB_READ_WRITE_TOKEN is not set");
	}
	return {
		put: async (keyName: string, keyValue: string) => {
			await put(keyName, keyValue, {
				access: "public",
			});
		},
		get: async (keyName: string) => {
			return await fetch(keyName).then((res) => res.json());
		},
	};
}
