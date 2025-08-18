import { describe, expect, it } from "vitest";
import { PR_22_DIFF, PR_1118_DIFF } from "./__fixtures__";
import { compressLargeDiff } from "./diff-compression";

describe("diff compression", () => {
	it("should return original diff when under maxSize", () => {
		const smallDiff = "diff --git a/test.txt b/test.txt\n+hello world";
		const result = compressLargeDiff(smallDiff, 1000);
		expect(result).toBe(smallDiff);
	});

	it("should compress PR #1118 diff to 10000 characters", () => {
		const compressed = compressLargeDiff(PR_1118_DIFF, 10000);

		expect(compressed.length).toBeLessThanOrEqual(10000);
		expect(compressed).toContain("diff --git");
		expect(compressed).toContain("ingest-github-repository.ts");
		expect(compressed).toContain("route.ts");
	});

	it("should preserve file headers in compressed output", () => {
		const compressed = compressLargeDiff(PR_1118_DIFF, 1500);

		expect(compressed).toContain(
			"diff --git a/apps/studio.giselles.ai/app/api/vector-stores/github/ingest/ingest-github-repository.ts",
		);
		expect(compressed).toContain("new file mode 100644");
		expect(compressed).toContain("index 000000000..b5ad8bde7");
		expect(compressed).toContain("--- /dev/null");
		expect(compressed).toContain(
			"+++ b/apps/studio.giselles.ai/app/api/vector-stores/github/ingest/ingest-github-repository.ts",
		);
	});

	it("should add truncation indicator when content is cut", () => {
		const compressed = compressLargeDiff(PR_1118_DIFF, 1500);

		expect(compressed).toContain("...");
	});

	it("should handle empty diff", () => {
		const result = compressLargeDiff("", 1000);
		expect(result).toBe("");
	});

	it("should handle single file diff", () => {
		const singleFileDiff = `diff --git a/test.txt b/test.txt
index 1234567..abcdefg 100644
--- a/test.txt
+++ b/test.txt
@@ -1,3 +1,3 @@
 line 1
-line 2
+line 2 modified
 line 3`;

		const compressed = compressLargeDiff(singleFileDiff, 150);
		expect(compressed.length).toBeLessThanOrEqual(150);
		expect(compressed).toContain("diff --git");
		expect(compressed).toContain("test.txt");
	});

	it("should show actual compression ratio for PR #1118", () => {
		const originalSize = PR_1118_DIFF.length;
		const compressed = compressLargeDiff(PR_1118_DIFF, 1500);
		const compressedSize = compressed.length;
		const compressionRatio = (
			((originalSize - compressedSize) / originalSize) *
			100
		).toFixed(1);

		console.log(`Original size: ${originalSize} characters`);
		console.log(`Compressed size: ${compressedSize} characters`);
		console.log(`Compression ratio: ${compressionRatio}%`);
		console.log("First 200 chars of compressed output:");
		console.log(`${compressed.substring(0, 200)}...`);

		expect(compressedSize).toBeLessThanOrEqual(10000);
		expect(originalSize).toBeGreaterThan(compressedSize);
	});

	it("should match snapshot for PR #1118 at 10000 chars", () => {
		const compressed = compressLargeDiff(PR_1118_DIFF, 10000);
		expect(compressed).toMatchSnapshot("pr-1118-compressed-10000.txt");
	});

	it("should match snapshot for PR #1118 at 15000 chars", () => {
		const compressed = compressLargeDiff(PR_1118_DIFF, 15000);
		expect(compressed).toMatchSnapshot("pr-1118-compressed-15000.txt");
	});

	it("should match snapshot for PR #1118 at 5000 chars", () => {
		const compressed = compressLargeDiff(PR_1118_DIFF, 5000);
		expect(compressed).toMatchSnapshot("pr-1118-compressed-5000.txt");
	});

	it("should replace base64 data URLs with placeholders", () => {
		const diffWithDataUrl = `diff --git a/test.json b/test.json
index 1234567..abcdefg 100644
--- a/test.json
+++ b/test.json
@@ -1,10 +1,10 @@
 {
-  "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
+  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgo"
+  "name": "test image",
+  "width": 100,
+  "height": 100,
+  "format": "jpeg",
+  "quality": 90,
+  "description": "A test image for demonstration purposes"
 }`;

		const compressed = compressLargeDiff(diffWithDataUrl, 500);
		expect(compressed).toContain("data:image/png;base64,<ENCODED DATA>");
		expect(compressed).toContain("data:image/jpeg;base64,<ENCODED DATA>");
		expect(compressed).not.toContain("iVBORw0KGgoAAAANSUhEUgAAAAE");
		expect(compressed).not.toContain("/9j/4AAQSkZJRgABAQAAAQABAAD");
	});

	it("should replace long base64 strings with placeholders", () => {
		const diffWithBase64 = `diff --git a/data.txt b/data.txt
index 1234567..abcdefg 100644
--- a/data.txt
+++ b/data.txt
@@ -1,10 +1,10 @@
-iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJgggABCDEFGHIJKLMNOPQRSTUVWXYZ
+/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgo
 Normal text line
 Another normal line
 This is a line with normal content
 More content here
 Some additional text
-VGhpcyBpcyBhIHZlcnkgbG9uZyBiYXNlNjQgZW5jb2RlZCBzdHJpbmcgdGhhdCBzaG91bGQgYmUgcmVwbGFjZWQgd2l0aCBhIHBsYWNlaG9sZGVy
+QW5vdGhlciB2ZXJ5IGxvbmcgYmFzZTY0IGVuY29kZWQgc3RyaW5nIHRoYXQgY29udGFpbnMgbG90cyBvZiBkYXRhIGFuZCBzaG91bGQgYmUgcmVwbGFjZWQ=
 Final line here
 End of content`;

		const compressed = compressLargeDiff(diffWithBase64, 600);
		expect(compressed).toContain("<ENCODED DATA>");
		expect(compressed).not.toContain("iVBORw0KGgoAAAANSUhEUgAAAAE");
		expect(compressed).not.toContain("VGhpcyBpcyBhIHZlcnkgbG9uZw");
		expect(compressed).toContain("Normal text line");
		expect(compressed).toContain("Another normal line");
	});

	it("should replace JSON with base64 data", () => {
		const diffWithJsonBase64 = `diff --git a/api-response.json b/api-response.json
index 1234567..abcdefg 100644
--- a/api-response.json
+++ b/api-response.json
@@ -1,12 +1,12 @@
 {
   "id": "12345",
-  "thumbnail": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
+  "thumbnail": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgo",
   "name": "test image",
   "description": "A sample API response",
   "created_at": "2024-01-01T00:00:00Z",
   "updated_at": "2024-01-01T00:00:00Z",
   "status": "active",
   "type": "image",
   "size": 1024
 }`;

		const compressed = compressLargeDiff(diffWithJsonBase64, 600);
		expect(compressed).toContain('"thumbnail":"<ENCODED DATA>"');
		expect(compressed).not.toContain("iVBORw0KGgoAAAANSUhEUgAAAAE");
		expect(compressed).toContain('"id": "12345"');
	});

	it("should replace hex encoded data", () => {
		const diffWithHexData = `diff --git a/binary.hex b/binary.hex
index 1234567..abcdefg 100644
--- a/binary.hex
+++ b/binary.hex
@@ -1,8 +1,8 @@
-89504e470d0a1a0a0000000d494844520000000100000001080600000075c1c8550000000d49444154785e63601800030000040001b5b1c2570000000049454e44ae426082
+ffd8ffe000104a46494600010101006000600000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffdb0043010909090c0b0c180d0d1832211c213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232ffff
 Short line
 Another line here
 Some more content
 Text content line
 Final content line`;

		const compressed = compressLargeDiff(diffWithHexData, 400);
		expect(compressed).toContain("<ENCODED DATA>");
		expect(compressed).not.toContain("89504e470d0a1a0a0000000d49484452");
		expect(compressed).not.toContain("ffd8ffe000104a46494600010101");
		expect(compressed).toContain("Short line");
	});

	it("should compress PR #22 diff effectively", () => {
		const originalSize = PR_22_DIFF.length;
		const compressed = compressLargeDiff(PR_22_DIFF, 8000);
		const compressedSize = compressed.length;
		const compressionRatio = (
			((originalSize - compressedSize) / originalSize) *
			100
		).toFixed(1);

		console.log(`PR #22 - Original size: ${originalSize} characters`);
		console.log(`PR #22 - Compressed size: ${compressedSize} characters`);
		console.log(`PR #22 - Compression ratio: ${compressionRatio}%`);

		expect(compressedSize).toBeLessThanOrEqual(8000);
		expect(originalSize).toBeGreaterThan(compressedSize);
		expect(compressed).toContain("diff --git");
	});

	it("should preserve important file headers in PR #22", () => {
		const compressed = compressLargeDiff(PR_22_DIFF, 8000);

		// Should contain diff headers for key files
		expect(compressed).toContain("diff --git");
		expect(compressed).toContain("index ");
		expect(compressed).toContain("+++");
		expect(compressed).toContain("---");
	});

	it("should match snapshot for PR #22 at 200000 chars", () => {
		const compressed = compressLargeDiff(PR_22_DIFF, 200_000);
		expect(compressed).toMatchSnapshot("pr-22-compressed-200000.txt");
	});

	it("should match snapshot for PR #22 at 12000 chars", () => {
		const compressed = compressLargeDiff(PR_22_DIFF, 12_000);
		expect(compressed).toMatchSnapshot("pr-22-compressed-12000.txt");
	});
});
