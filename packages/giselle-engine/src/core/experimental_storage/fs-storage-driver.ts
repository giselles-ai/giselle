import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import type { z } from "zod/v4";
import type {
	GetJsonParams,
	GiselleStorage,
	SetJsonParams,
} from "./types/interface";

export interface FsStorageDriverConfig {
	root: string;
}

async function ensureDir(filePath: string): Promise<void> {
	await fs.mkdir(dirname(filePath), { recursive: true });
}

export function fsStorageDriver(config: FsStorageDriverConfig): GiselleStorage {
	return {
		async getJson<T extends z.ZodObject>(
			params: GetJsonParams<T>,
		): Promise<z.infer<T>> {
			const fullPath = join(config.root, params.path);
			const content = await fs.readFile(fullPath, "utf8");
			const obj = JSON.parse(content);
			return params.schema ? params.schema.parse(obj) : obj;
		},

		async setJson<T extends z.ZodObject>(
			params: SetJsonParams<T>,
		): Promise<void> {
			const fullPath = join(config.root, params.path);
			await ensureDir(fullPath);
			const data = params.schema
				? params.schema.parse(params.data)
				: params.data;
			await fs.writeFile(fullPath, JSON.stringify(data), "utf8");
		},

		async getBlob(path: string): Promise<Uint8Array> {
			const fullPath = join(config.root, path);
			const buffer = await fs.readFile(fullPath);
			return new Uint8Array(buffer);
		},

		async setBlob(path: string, data: Uint8Array): Promise<void> {
			const fullPath = join(config.root, path);
			await ensureDir(fullPath);
			await fs.writeFile(fullPath, data);
		},

		async copy(source: string, destination: string): Promise<void> {
			const srcPath = join(config.root, source);
			const destPath = join(config.root, destination);
			await ensureDir(destPath);
			await fs.copyFile(srcPath, destPath);
		},

		async remove(path: string): Promise<void> {
			const fullPath = join(config.root, path);
			await fs.rm(fullPath, { recursive: true, force: true });
		},
	};
}
