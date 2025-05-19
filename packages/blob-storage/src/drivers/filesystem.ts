import { promises as fs, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { BlobStorageDriver, GetKeysOptions, WatchCallback } from "..";

export interface FilesystemDriverOptions {
	base: string;
}

function toPath(base: string, key: string) {
	const normalized = key.replace(/:/g, "/");
	return join(base, normalized);
}

async function ensureDir(dir: string) {
	await fs.mkdir(dir, { recursive: true });
}

async function list(dir: string, base: string, files: string[]) {
	const entries = await fs
		.readdir(dir, { withFileTypes: true })
		.catch(() => []);
	for (const entry of entries) {
		const full = join(dir, entry.name);
		const rel = full.slice(base.length + 1).replace(/\\/g, "/");
		if (entry.isDirectory()) {
			await list(full, base, files);
		} else {
			files.push(rel.replace(/\//g, ":"));
		}
	}
	return files;
}

export function filesystemDriver(
	options: FilesystemDriverOptions,
): BlobStorageDriver {
	const base = resolve(options.base);

	return {
		async hasItem(key) {
			return existsSync(toPath(base, key));
		},
		async getItem(key) {
			try {
				return await fs.readFile(toPath(base, key), "utf8");
			} catch {
				return null;
			}
		},
		async setItem(key, value) {
			const file = toPath(base, key);
			await ensureDir(dirname(file));
			await fs.writeFile(file, value, "utf8");
		},
		async copyItem(from, to) {
			const srcFile = toPath(base, from);
			const dstFile = toPath(base, to);
			const data = await fs.readFile(srcFile);
			await ensureDir(dirname(dstFile));
			await fs.writeFile(dstFile, data);
		},
		async setItemRaw(key, value) {
			const file = toPath(base, key);
			await ensureDir(dirname(file));
			await fs.writeFile(file, Buffer.from(value));
		},
		async getItemRaw(key) {
			return await fs.readFile(toPath(base, key));
		},
		async removeItem(key) {
			try {
				await fs.unlink(toPath(base, key));
			} catch {}
		},
		async getKeys(prefix = "", _opts?: GetKeysOptions) {
			const dir = toPath(base, prefix);
			return list(dir, base, []);
		},
		async clear(prefix = "") {
			const dir = toPath(base, prefix);
			await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
		},
		async dispose() {},
		async watch(_cb: WatchCallback) {
			return async () => {};
		},
	};
}
