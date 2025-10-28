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
	const uploadedAtStore = new Map<string, Date>();

	const initializeUploadedAt = (entries: Iterable<string>): void => {
		for (const key of entries) {
			if (!uploadedAtStore.has(key)) {
				uploadedAtStore.set(key, new Date());
			}
		}
	};

	initializeUploadedAt(jsonStore.keys());
	initializeUploadedAt(blobStore.keys());

	const recordUpload = (path: string): void => {
		uploadedAtStore.set(path, new Date());
	};

	const contentLengthForKey = (path: string): number => {
		const jsonData = jsonStore.get(path);
		if (jsonData !== undefined) {
			const jsonString = JSON.stringify(jsonData);
			return new TextEncoder().encode(jsonString).length;
		}

		const blobData = blobStore.get(path);
		if (blobData !== undefined) {
			return blobData.length;
		}

		return 0;
	};

	return {
		getJson<T extends z.ZodType>(
			params: GetJsonParams<T>,
		): Promise<z.infer<T>> {
			const data = jsonStore.get(params.path);
			if (data === undefined) {
				return Promise.reject(new Error(`No JSON stored at ${params.path}`));
			}
			const parsed = params.schema.parse(data);
			return Promise.resolve(parsed);
		},

		setJson<T extends z.ZodType>(params: SetJsonParams<T>): Promise<void> {
			const parsed = params.schema
				? params.schema.parse(params.data)
				: params.data;
			jsonStore.set(params.path, parsed);
			recordUpload(params.path);
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
			recordUpload(path);
			return Promise.resolve();
		},

		copy(source: string, destination: string): Promise<void> {
			const jsonData = jsonStore.get(source);
			if (jsonData !== undefined) {
				jsonStore.set(destination, jsonData);
				recordUpload(destination);
				return Promise.resolve();
			}

			const blobData = blobStore.get(source);
			if (blobData !== undefined) {
				blobStore.set(destination, new Uint8Array(blobData));
				recordUpload(destination);
				return Promise.resolve();
			}

			return Promise.reject(new Error(`No data stored at ${source}`));
		},

		remove(path: string): Promise<void> {
			jsonStore.delete(path);
			blobStore.delete(path);
			uploadedAtStore.delete(path);
			return Promise.resolve();
		},

		exists(path: string): Promise<boolean> {
			return Promise.resolve(jsonStore.has(path) || blobStore.has(path));
		},

		contentLength(path: string): Promise<number> {
			const jsonData = jsonStore.get(path);
			if (jsonData !== undefined) {
				const jsonString = JSON.stringify(jsonData);
				return Promise.resolve(new TextEncoder().encode(jsonString).length);
			}

			const blobData = blobStore.get(path);
			if (blobData !== undefined) {
				return Promise.resolve(blobData.length);
			}

			return Promise.reject(new Error(`No data stored at ${path}`));
		},

		listBlobs(params = {}) {
			const { prefix = "", limit, cursor } = params;
			const normalizedPrefix = prefix.replace(/^\/+/, "");

			const startIndex =
				typeof cursor === "string" && cursor.length > 0
					? Number.parseInt(cursor, 10)
					: 0;

			if (!Number.isFinite(startIndex) || startIndex < 0) {
				return Promise.reject(
					new Error(`Invalid cursor value: ${cursor ?? ""}`),
				);
			}

			const allKeys = new Set<string>();
			for (const key of jsonStore.keys()) {
				allKeys.add(key);
			}
			for (const key of blobStore.keys()) {
				allKeys.add(key);
			}

			const filtered = Array.from(allKeys)
				.filter((key) =>
					normalizedPrefix.length > 0 ? key.startsWith(normalizedPrefix) : true,
				)
				.sort((a, b) => a.localeCompare(b));

			const effectiveLimit =
				typeof limit === "number" && limit > 0 ? limit : undefined;
			const endIndex =
				effectiveLimit !== undefined
					? Math.min(startIndex + effectiveLimit, filtered.length)
					: filtered.length;

			const slice = filtered.slice(startIndex, endIndex);

			const blobs = slice.map((key) => {
				const uploadedAt = uploadedAtStore.get(key) ?? new Date(0);
				const size = contentLengthForKey(key);

				return {
					pathname: key,
					size,
					uploadedAt,
					contentType: jsonStore.has(key) ? "application/json" : undefined,
				};
			});

			const hasMore = endIndex < filtered.length;
			const nextCursor = hasMore ? String(endIndex) : undefined;

			return Promise.resolve({
				blobs,
				hasMore,
				cursor: nextCursor,
			});
		},
	};
}
