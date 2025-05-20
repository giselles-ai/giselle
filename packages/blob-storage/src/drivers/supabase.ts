import { createClient } from "@supabase/supabase-js";
import type {
	BlobStorageDriver,
	GetItemOptions,
	GetKeysOptions,
	SetItemOptions,
	SetItemRawOptions,
} from "..";
import { joinKeys } from "..";

export interface SupabaseStorageDriverOptions {
	supabaseUrl: string;
	supabaseServiceKey: string;
	bucket: string;
}

const r = (key: string) => {
	const path = key.startsWith("/") ? key.slice(1) : key;
	return path.replace(/:/g, "/");
};

export function supabaseStorageDriver(
	options: SupabaseStorageDriverOptions,
): BlobStorageDriver {
	const supabase = createClient(
		options.supabaseUrl,
		options.supabaseServiceKey,
		{},
	);
	const bucket = options.bucket;

	async function getNestedList(
		prefix: string,
		maxLevel = 4,
		currentLevel = 0,
	): Promise<string[]> {
		if (currentLevel > maxLevel) {
			return [];
		}

		const { data, error } = await supabase.storage.from(bucket).list(r(prefix));
		if (error || !data) {
			return [];
		}

		const results: string[] = [];
		for (const item of data) {
			const itemPath = joinKeys(prefix, item.name);
			if (!item.id) {
				if (currentLevel < maxLevel) {
					const nestedFiles = await getNestedList(
						itemPath,
						maxLevel,
						currentLevel + 1,
					);
					results.push(...nestedFiles);
				}
			} else {
				results.push(itemPath);
			}
		}
		return results;
	}

	return {
		async hasItem(key) {
			const path = r(key);
			const dirPath = path.split("/").slice(0, -1).join("/");
			const fileName = path.split("/").pop() || "";
			const { data, error } = await supabase.storage
				.from(bucket)
				.list(dirPath, { search: fileName });
			if (error) {
				return false;
			}
			return !!data && data.length > 0;
		},
		async getItem(key, opts?: GetItemOptions) {
			if (opts?.publicURL) {
				const path = r(key);
				const { data } = supabase.storage.from(bucket).getPublicUrl(path);
				return data.publicUrl || null;
			}
			let path = r(key);
			if (opts?.bypassingCache) {
				path = `${path}?timestamp=${Date.now()}`;
			}
			const { data, error } = await supabase.storage
				.from(bucket)
				.download(path);
			if (error) {
				return null;
			}
			return await data.text();
		},
		async setItem(key, value, opts?: SetItemOptions) {
			const { cacheControlMaxAge, contentType } = opts || {};
			const { error } = await supabase.storage
				.from(bucket)
				.upload(r(key), value, {
					upsert: true,
					cacheControl: cacheControlMaxAge,
					contentType,
				});
			if (error) {
				throw new Error(`Failed to set item at ${key}: ${error.message}`);
			}
		},
		async copyItem(from, to) {
			const { error } = await supabase.storage
				.from(bucket)
				.copy(r(from), r(to));
			if (error) {
				throw new Error(
					`Failed to copy item from ${from} to ${to}: ${error.message}`,
				);
			}
		},
		async setItemRaw(key, value, opts?: SetItemRawOptions) {
			const { contentType } = opts || {};
			const { error } = await supabase.storage
				.from(bucket)
				.upload(r(key), value, {
					upsert: true,
					contentType,
				});
			if (error) {
				throw new Error(`Failed to set item at ${key}: ${error.message}`);
			}
		},
		async getItemRaw(key) {
			const { data, error } = await supabase.storage
				.from(bucket)
				.download(r(key));
			if (error || !data) {
				throw new Error(
					`Failed to get item at ${key}: ${error?.message || "Unknown error"}`,
				);
			}
			return await data.arrayBuffer();
		},
		async removeItem(key) {
			const { error } = await supabase.storage.from(bucket).remove([r(key)]);
			if (error) {
				throw new Error(`Failed to remove item at ${key}: ${error.message}`);
			}
		},
		async getKeys(base, opts?: GetKeysOptions) {
			const level = opts?.level || 2;
			return getNestedList(base, level);
		},
		async clear(base) {
			const prefix = base ? r(base) : "";
			const { data, error } = await supabase.storage.from(bucket).list(prefix);
			if (error || !data || data.length === 0) {
				return;
			}
			const filePaths = data.map((item) =>
				prefix ? joinKeys(prefix, item.name) : item.name,
			);
			await supabase.storage.from(bucket).remove(filePaths);
		},
	};
}
