import { createLocalStorageClient } from "./browser-local-storage";
import { createLocalFileSystemStorageClient } from "./local-filesystem";
import type { StorageClient, StorageConfiguration } from "./types";
import { createVercelBlobStorageClient } from "./vercel-blob";

export function createStorageClient(
	config: StorageConfiguration,
): StorageClient {
	if (config.type === "localstorage") {
		return createLocalStorageClient();
	}
	if (config.type === "localfilesystem") {
		return createLocalFileSystemStorageClient();
	}
	if (config.type === "remote" && config.provider === "vercel-blob") {
		return createVercelBlobStorageClient();
	}
	throw new Error("Invalid storage configuration");
}
