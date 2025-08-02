import type { z } from "zod/v4";

export type BlobLike = Buffer | Uint8Array | ArrayBuffer;

export interface GetJsonParams<T extends z.ZodType> {
	path: string;
	schema: T;
}

export interface SetJsonParams<T extends z.ZodType> {
	path: string;
	schema?: T;
	data: z.infer<T>;
}

type GetJson = <T extends z.ZodType>(
	params: GetJsonParams<T>,
) => Promise<z.infer<T>>;

type SetJson = <T extends z.ZodType>(params: SetJsonParams<T>) => Promise<void>;

type GetBlob = (path: string) => Promise<Uint8Array>;

type SetBlob = (path: string, data: BlobLike) => Promise<void>;

type Copy = (source: string, destination: string) => Promise<void>;

type Remove = (path: string) => Promise<void>;

type Exists = (path: string) => Promise<boolean>;

export interface GiselleStorage {
	getJson: GetJson;
	setJson: SetJson;
	getBlob: GetBlob;
	setBlob: SetBlob;
	copy: Copy;
	remove: Remove;
	exists: Exists;
}
