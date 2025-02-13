import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import * as path from "node:path";
import type { StorageClient } from "./types";

export function createLocalFileSystemStorageClient(): StorageClient {
	return {
		put: async (keyName: string, keyValue: string) => {
			const dirname = path.dirname(keyName);
			try {
				await stat(dirname);
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") {
					await mkdir(dirname, { recursive: true });
				} else {
					throw error;
				}
			}
			await writeFile(keyName, keyValue, "utf8");
		},
		get: async (keyName: string) => {
			try {
				return await readFile(keyName, "utf8");
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") {
					return null;
				}
				throw error;
			}
		},
	};
}
