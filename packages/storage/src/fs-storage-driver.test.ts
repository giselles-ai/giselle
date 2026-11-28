import {
	mkdir,
	mkdtemp,
	readFile,
	rm,
	symlink,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { z } from "zod/v4";
import { fsStorageDriver } from "./fs-storage-driver";

let directory: string;
let root: string;
let storage: ReturnType<typeof fsStorageDriver>;
beforeEach(async () => {
	directory = await mkdtemp(join(tmpdir(), "giselle-storage-"));
	root = join(directory, "store");
	storage = fsStorageDriver({ root });
});
afterEach(async () => {
	await rm(directory, { recursive: true, force: true });
});

it("creates and accesses nested files, including range reads and directory removal", async () => {
	await storage.setJson({ path: "nested/data", data: "saved" });
	expect(
		await storage.getJson({ path: "nested/data", schema: z.string() }),
	).toBe("saved");
	await storage.copy("nested/data", "copy/data");
	expect(await storage.contentLength("copy/data")).toBe(7);
	expect(
		new TextDecoder().decode(
			await storage.getBlob("copy/data", { range: { start: 1, end: 6 } }),
		),
	).toBe("saved");
	expect(
		(await storage.listBlobs({ prefix: "nested/" })).blobs.map(
			(blob) => blob.pathname,
		),
	).toEqual(["nested/data"]);
	await storage.remove("nested");
	expect(await storage.exists("nested/data")).toBe(false);
});

it.each([
	"../outside/data",
	"nested/../../outside/data",
	"absolute",
	"link/data",
	"leaf",
	"dangling",
])("rejects out-of-bounds file operations for %s", async (key) => {
	const outside = join(directory, "outside");
	await mkdir(outside);
	await writeFile(join(outside, "data"), '"original"');
	await mkdir(root);
	await symlink(outside, join(root, "link"));
	await symlink(join(outside, "data"), join(root, "leaf"));
	await symlink(join(outside, "missing"), join(root, "dangling"));
	await storage.setBlob("inside", Buffer.from("inside"));
	const path = key === "absolute" ? join(outside, "data") : key;
	const operations = [
		() => storage.getJson({ path, schema: z.string() }),
		() => storage.setJson({ path, data: "changed" }),
		() => storage.getBlob(path),
		() => storage.setBlob(path, Buffer.from("changed")),
		() => storage.copy(path, "copy"),
		() => storage.copy("inside", path),
		() => storage.exists(path),
		() => storage.contentLength(path),
		() => storage.remove(path),
	];
	for (const operation of operations)
		await expect(operation()).rejects.toThrow(/storage/);
	expect(
		(await storage.listBlobs()).blobs.map((blob) => blob.pathname),
	).toEqual(["inside"]);
	expect(await readFile(join(outside, "data"), "utf8")).toBe('"original"');
	await expect(readFile(join(outside, "missing"))).rejects.toMatchObject({
		code: "ENOENT",
	});
});

it("rejects removal of the storage root and refuses a symlinked root", async () => {
	await storage.setJson({ path: "keep", data: true });
	for (const key of ["", ".", "./", "nested/.."]) {
		await expect(storage.remove(key)).rejects.toThrow(/storage/);
	}
	expect(await storage.exists("keep")).toBe(true);
	const alias = join(directory, "alias");
	await symlink(root, alias);
	await expect(fsStorageDriver({ root: alias }).listBlobs()).rejects.toThrow(
		/storage/,
	);
});
