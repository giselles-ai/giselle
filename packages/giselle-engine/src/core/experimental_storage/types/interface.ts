import type { z } from "zod/v4";

export interface GetJsonParams<T extends z.ZodObject> {
	path: string;
	schema?: T;
}

export interface SetJsonParams<T extends z.ZodObject> {
	path: string;
	schema?: T;
	data: z.infer<T>;
}

type GetJson = <T extends z.ZodObject>(
	params: GetJsonParams<T>,
) => Promise<z.infer<T>>;

type SetJson = <T extends z.ZodObject>(
	params: SetJsonParams<T>,
) => Promise<void>;

type GetBlob = (path: string) => Promise<Uint8Array>;

type SetBlob = (path: string, data: Uint8Array) => Promise<void>;

type Copy = (source: string, destination: string) => Promise<void>;

type Remove = (path: string) => Promise<void>;

export interface GiselleStorage {
	getJson: GetJson;
	setJson: SetJson;
	getBlob: GetBlob;
	setBlob: SetBlob;
	copy: Copy;
	remove: Remove;
}
