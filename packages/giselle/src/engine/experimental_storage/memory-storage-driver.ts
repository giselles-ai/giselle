import type { z } from "zod/v4";
import type {
	BlobLike,
	GetJsonParams,
	GiselleStorage,
	SetJsonParams,
} from "./types";

export interface MemoryStorageDriverConfig {
	initialJson?: Record<string, unknown>;
	initialBlob?: Record<string, Uint8Array>;
}

export function memoryStorageDriver(
	config: MemoryStorageDriverConfig = {},
): GiselleStorage {
	const jsonStore = new Map<string, unknown>(
		Object.entries(config.initialJson ?? {}),
	);
	const blobStore = new Map<string, Uint8Array>(
		Object.entries(config.initialBlob ?? {}).map(([k, v]) => [
			k,
			new Uint8Array(v),
		]),
	);

	return {
		getJson<T extends z.ZodType>(
			params: GetJsonParams<T>,
		): Promise<z.infer<T>> {
			const data = jsonStore.get(params.path);
			if (data === undefined) {
				return Promise.reject(new Error(`No JSON stored at ${params.path}`));
			}
			const parsed = params.schema
				? params.schema.parse(data)
				: (data as z.infer<T>);
			return Promise.resolve(parsed);
		},

		setJson<T extends z.ZodType>(params: SetJsonParams<T>): Promise<void> {
			const parsed = params.schema
				? params.schema.parse(params.data)
				: params.data;
			jsonStore.set(params.path, parsed);
			return Promise.resolve();
		},

		getBlob(path: string): Promise<Uint8Array> {
			const data = blobStore.get(path);
			if (data === undefined) {
				return Promise.reject(new Error(`No blob stored at ${path}`));
			}
			return Promise.resolve(new Uint8Array(data));
		},

		setBlob(path: string, data: BlobLike): Promise<void> {
			const uint8Array = new Uint8Array(data);
			blobStore.set(path, uint8Array);
			return Promise.resolve();
		},

		copy(source: string, destination: string): Promise<void> {
			const jsonData = jsonStore.get(source);
			if (jsonData !== undefined) {
				jsonStore.set(destination, jsonData);
				return Promise.resolve();
			}

			const blobData = blobStore.get(source);
			if (blobData !== undefined) {
				blobStore.set(destination, new Uint8Array(blobData));
				return Promise.resolve();
			}

			return Promise.reject(new Error(`No data stored at ${source}`));
		},

		remove(path: string): Promise<void> {
			jsonStore.delete(path);
			blobStore.delete(path);
			return Promise.resolve();
		},

		exists(path: string): Promise<boolean> {
			return Promise.resolve(jsonStore.has(path) || blobStore.has(path));
		},
	};
}
