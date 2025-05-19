export interface GetItemOptions {
	bypassingCache?: boolean;
	publicURL?: boolean;
}

export interface SetItemOptions {
	cacheControlMaxAge?: number;
	contentType?: string;
}

export interface SetItemRawOptions {
	contentType?: string;
}

export interface GetKeysOptions {
	level?: number;
}

export type WatchEvent = "update" | "remove";
export type WatchCallback = (event: WatchEvent, key: string) => void;

export interface BlobStorageDriver {
	hasItem(key: string, opts?: Record<string, unknown>): Promise<boolean>;
	getItem(key: string, opts?: GetItemOptions): Promise<unknown>;
	setItem(key: string, value: string, opts?: SetItemOptions): Promise<void>;
	copyItem?(
		from: string,
		to: string,
		opts?: Record<string, unknown>,
	): Promise<void>;
	setItemRaw?(
		key: string,
		value: ArrayBuffer | Uint8Array | Buffer,
		opts?: SetItemRawOptions,
	): Promise<void>;
	getItemRaw?(
		key: string,
		opts?: Record<string, unknown>,
	): Promise<ArrayBuffer | Uint8Array | Buffer | null>;
	removeItem?(key: string, opts?: Record<string, unknown>): Promise<void>;
	getKeys?(base: string, opts?: GetKeysOptions): Promise<string[]>;
	clear?(base: string, opts?: Record<string, unknown>): Promise<void>;
	dispose?(): Promise<void>;
	watch?(callback: WatchCallback): Promise<() => void>;
}

export function defineDriver<O>(factory: (opts: O) => BlobStorageDriver) {
	return factory;
}

export function createStorage(options: {
	driver: BlobStorageDriver;
}): BlobStorageDriver {
	return options.driver;
}

export function joinKeys(...keys: string[]): string {
	return keys
		.map((k) => k.replace(/^:+|:+$/g, ""))
		.filter(Boolean)
		.join(":");
}
