import { promises as fs } from "node:fs";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import type * as z from "zod/v4";
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
	const root = resolve(config.root);

	async function checkedPath(key: string, allowRoot = false): Promise<string> {
		const parts = key
			.split(sep === "/" ? "/" : /[\\/]/)
			.filter((part) => part !== "" && part !== ".");
		if (
			isAbsolute(key) ||
			parts.includes("..") ||
			(!allowRoot && parts.length === 0)
		) {
			throw new Error("Expected a relative path inside the storage root");
		}

		let current = root;
		for (const part of ["", ...parts]) {
			current = join(current, part);
			try {
				if ((await fs.lstat(current)).isSymbolicLink()) {
					throw new Error("Symbolic links are not allowed in storage paths");
				}
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") break;
				throw error;
			}
		}
		return join(root, ...parts);
	}
	return {
		async getJson<T extends z.ZodType>(
			params: GetJsonParams<T>,
		): Promise<z.infer<T>> {
			const fullPath = await checkedPath(params.path);

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
			const fullPath = await checkedPath(params.path);
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
			const fullPath = await checkedPath(path);

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
			const fullPath = await checkedPath(path);
			await ensureDir(fullPath);
			const uint8Array = new Uint8Array(data);
			await fs.writeFile(fullPath, uint8Array);
		},

		async copy(source: string, destination: string): Promise<void> {
			const srcPath = await checkedPath(source);
			const destPath = await checkedPath(destination);
			await ensureDir(destPath);
			await fs.copyFile(srcPath, destPath);
		},

		async remove(path: string): Promise<void> {
			const fullPath = await checkedPath(path);
			await fs.rm(fullPath, { recursive: true, force: true });
		},

		async exists(path: string): Promise<boolean> {
			const fullPath = await checkedPath(path);
			try {
				await fs.access(fullPath);
				return true;
			} catch {
				return false;
			}
		},

		async contentLength(path: string): Promise<number> {
			const fullPath = await checkedPath(path);
			const stats = await fs.stat(fullPath);
			return stats.size;
		},

		async listBlobs(params = {}) {
			const { prefix = "", limit, cursor } = params;
			const normalizedPrefix = prefix.replace(/^\/+/, "");

			const startIndex =
				typeof cursor === "string" && cursor.length > 0
					? Number.parseInt(cursor, 10)
					: 0;

			if (!Number.isFinite(startIndex) || startIndex < 0) {
				throw new Error(`Invalid cursor value: ${cursor ?? ""}`);
			}

			const collected: {
				pathname: string;
				size: number;
				uploadedAt: Date;
			}[] = [];

			const walk = async (relativeDir: string): Promise<void> => {
				const absoluteDir = await checkedPath(relativeDir, true);

				let entries: import("node:fs").Dirent[];
				try {
					entries = await fs.readdir(absoluteDir, { withFileTypes: true });
				} catch (error) {
					// Directory might not exist yet; ignore and stop traversal.
					if ((error as NodeJS.ErrnoException).code === "ENOENT") {
						return;
					}
					throw error;
				}

				const prefixToMatch = normalizedPrefix;

				for (const entry of entries) {
					const entryPath =
						relativeDir.length > 0
							? `${relativeDir}/${entry.name}`
							: entry.name;

					if (entry.isDirectory()) {
						// Skip traversing directories that cannot possibly match the prefix.
						if (
							prefixToMatch.length > 0 &&
							!prefixToMatch.startsWith(`${entryPath}/`) &&
							!entryPath.startsWith(prefixToMatch)
						) {
							continue;
						}
						await walk(entryPath);
						continue;
					}

					if (entry.isFile()) {
						if (
							prefixToMatch.length > 0 &&
							!entryPath.startsWith(prefixToMatch)
						) {
							continue;
						}

						const stats = await fs.stat(await checkedPath(entryPath));
						collected.push({
							pathname: entryPath,
							size: stats.size,
							uploadedAt: stats.mtime,
						});
					}
				}
			};

			await walk("");

			const sorted = collected.sort((a, b) =>
				a.pathname.localeCompare(b.pathname),
			);

			const effectiveLimit =
				typeof limit === "number" && limit > 0 ? limit : undefined;
			const endIndex =
				effectiveLimit !== undefined
					? Math.min(startIndex + effectiveLimit, sorted.length)
					: sorted.length;

			const slice = sorted.slice(startIndex, endIndex);

			const hasMore = endIndex < sorted.length;
			const nextCursor = hasMore ? String(endIndex) : undefined;

			return {
				blobs: slice.map((item) => ({
					pathname: item.pathname,
					size: item.size,
					uploadedAt: item.uploadedAt,
				})),
				hasMore,
				cursor: nextCursor,
			};
		},
	};
}
