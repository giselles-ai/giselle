import { createClient } from "@supabase/supabase-js";
import { defineDriver, joinKeys } from "unstorage";

interface SupabaseStorageDriverOptions {
	supabaseUrl: string;
	supabaseServiceKey: string;
	bucket: string;
}

/**
 * normalize and replace delimitter from unstorage style(:) to supabase style(/)
 * reference implementation: https://github.com/unjs/unstorage/blob/5498818fa0f3cc40120ed46bd4035927104d7e1c/src/drivers/vercel-blob.ts
 */
const r = (key: string) => {
	const path = key.startsWith("/") ? key.slice(1) : key;
	return path.replace(/:/g, "/");
};

export default defineDriver((options: SupabaseStorageDriverOptions) => {
	const supabase = createClient(
		options.supabaseUrl,
		options.supabaseServiceKey,
		{},
	);
	const bucket = options.bucket;

	/**
	 * Recursively lists all files in a directory up to a specified level
	 * @param prefix The directory path to list
	 * @param currentLevel Current recursion level
	 * @param maxLevel Maximum recursion level
	 * @returns Array of all file paths
	 */
	async function getNestedList(
		prefix: string,
		maxLevel = 4,
		currentLevel = 0,
	): Promise<string[]> {
		// Stop recursion if we've reached the maximum level
		if (currentLevel > maxLevel) {
			return [];
		}

		const { data, error } = await supabase.storage.from(bucket).list(r(prefix));

		if (error || !data) {
			return [];
		}

		// Process files and folders
		const results: string[] = [];

		for (const item of data) {
			const itemPath = joinKeys(prefix, item.name);

			if (!item.id) {
				// It's a folder, recurse if we haven't reached max level
				if (currentLevel < maxLevel) {
					const nestedFiles = await getNestedList(
						itemPath,
						maxLevel,
						currentLevel + 1,
					);
					results.push(...nestedFiles);
				}
			} else {
				// It's a file
				results.push(itemPath);
			}
		}

		return results;
	}

	return {
		name: "supabase-storage-driver",
		options,

		async hasItem(key, _opts) {
			const path = r(key);
			const dirPath = path.split("/").slice(0, -1).join("/");
			const fileName = path.split("/").pop() || "";

			const { data, error } = await supabase.storage
				.from(bucket)
				.list(dirPath, {
					search: fileName,
				});

			if (error) {
				return false;
			}

			return data && data.length > 0;
		},

		async getItem(key, opts) {
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

			// Convert Blob to string or Buffer based on the data type
			return await data.text.text();
		},

		async setItem(key, value, opts) {
			const cacheControl = opts?.cacheControl;
			const contentType = opts?.contentType;

			const { error } = await supabase.storage
				.from(bucket)
				.upload(r(key), value, {
					upsert: true,
					cacheControl,
					contentType,
				});

			if (error) {
				throw new Error(`Failed to set item at ${key}: ${error.message}`);
			}
		},

		async setItemRaw(key, value, opts) {
			const contentType = opts?.contentType;

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

		async getItemRaw(key, _opts) {
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

		async removeItem(key, _opts) {
			const { error } = await supabase.storage.from(bucket).remove([r(key)]);

			if (error) {
				throw new Error(`Failed to remove item at ${key}: ${error.message}`);
			}
		},

		getKeys(base, opts) {
			const level = opts?.level || 2;
			return getNestedList(base, level);
		},

		async clear(base, _opts) {
			const prefix = base ? r(base) : "";
			const { data, error } = await supabase.storage.from(bucket).list(prefix);

			if (error || !data || data.length === 0) {
				return;
			}

			// Delete all files with the given prefix
			const filePaths = data.map((item) => {
				return prefix ? joinKeys(prefix, item.name) : item.name;
			});

			await supabase.storage.from(bucket).remove(filePaths);
		},

		async dispose() {
			// No specific cleanup needed for Supabase client
		},

		// biome-ignore lint/suspicious/useAwait: depends on interface
		async watch(_callback) {
			// Supabase doesn't support file watching natively
			// Return unwatch function
			return () => {};
		},
	};
});
