import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import type { z } from "zod/v4";
import type {
	BlobLike,
	GetJsonParams,
	GiselleStorage,
	SetJsonParams,
} from "./types";

export interface FsStorageDriverConfig {
	root: string;
}

async function ensureDir(filePath: string): Promise<void> {
	await fs.mkdir(dirname(filePath), { recursive: true });
}

export function fsStorageDriver(config: FsStorageDriverConfig): GiselleStorage {
	return {
		async getJson<T extends z.ZodType>(
			params: GetJsonParams<T>,
		): Promise<z.infer<T>> {
			const fullPath = join(config.root, params.path);

			await fs.access(fullPath);

			let obj = {};
			const maxRetries = 5;
			let lastError: unknown;

			for (let attempt = 0; attempt < maxRetries; attempt++) {
				try {
					// Re-read the file on each attempt
					const content = await fs.readFile(fullPath, "utf8");
					obj = JSON.parse(content);
					break;
				} catch (error) {
					lastError = error;
					if (attempt < maxRetries - 1) {
						const delay = 2 ** attempt * 100;
						await new Promise((resolve) => setTimeout(resolve, delay));
					}
				}
			}

			if (Object.keys(obj).length === 0 && lastError) {
				throw lastError;
			}

			return params.schema.parse(obj);
		},

		async setJson<T extends z.ZodType>(
			params: SetJsonParams<T>,
		): Promise<void> {
			const fullPath = join(config.root, params.path);
			await ensureDir(fullPath);
			const data = params.schema
				? params.schema.parse(params.data)
				: params.data;
			await fs.writeFile(fullPath, JSON.stringify(data), "utf8");
		},

		async getBlob(
			path: string,
			options?: { range?: { start: number; end?: number } },
		): Promise<Uint8Array> {
			const fullPath = join(config.root, path);

			if (!options?.range) {
				const buffer = await fs.readFile(fullPath);
				return new Uint8Array(buffer);
			}

			const { start, end } = options.range;
			const fd = await fs.open(fullPath, "r");

			try {
				const stats = await fd.stat();
				const fileSize = stats.size;

				// Clamp start to valid range
				const actualStart = Math.max(0, Math.min(start, fileSize));

				// If end is not provided, read to end of file
				// If end is provided, clamp it to valid range
				const actualEnd =
					end !== undefined
						? Math.max(actualStart, Math.min(end, fileSize))
						: fileSize;

				const length = actualEnd - actualStart;

				if (length <= 0) {
					return new Uint8Array(0);
				}

				const buffer = Buffer.allocUnsafe(length);
				const { bytesRead } = await fd.read(buffer, 0, length, actualStart);

				return new Uint8Array(buffer.subarray(0, bytesRead));
			} finally {
				await fd.close();
			}
		},

		async setBlob(path: string, data: BlobLike): Promise<void> {
			const fullPath = join(config.root, path);
			await ensureDir(fullPath);
			const uint8Array = new Uint8Array(data);
			await fs.writeFile(fullPath, uint8Array);
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

		async exists(path: string): Promise<boolean> {
			const fullPath = join(config.root, path);
			try {
				await fs.access(fullPath);
				return true;
			} catch {
				return false;
			}
		},
	};
}
