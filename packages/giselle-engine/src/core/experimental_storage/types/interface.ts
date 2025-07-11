import type { z } from "zod/v4";
import type { BlobLike } from "./blob-like";

export type JsonSchema = z.ZodObject | z.ZodDiscriminatedUnion | z.ZodArray;
export interface GetJsonParams<T extends JsonSchema> {
	path: string;
	schema?: T;
}

export interface SetJsonParams<T extends JsonSchema> {
	path: string;
	schema?: T;
	data: z.infer<T>;
}

type GetJson = <T extends JsonSchema>(
	params: GetJsonParams<T>,
) => Promise<z.infer<T>>;

type SetJson = <T extends JsonSchema>(
	params: SetJsonParams<T>,
) => Promise<void>;

type GetBlob = (path: string) => Promise<Uint8Array>;

type SetBlob = (path: string, data: BlobLike) => Promise<void>;

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
