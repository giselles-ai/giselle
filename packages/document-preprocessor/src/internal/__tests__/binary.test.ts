import { describe, expect, it } from "vitest";

import { toUint8Array } from "../binary.js";

describe("toUint8Array", () => {
	it("returns the same Uint8Array instance", () => {
		const data = new Uint8Array([1, 2, 3]);
		expect(toUint8Array(data)).toBe(data);
	});

	it("copies ArrayBufferView with offset", () => {
		const buffer = new Uint8Array([0, 1, 2, 3]).buffer;
		const view = new DataView(buffer, 1, 2);
		const result = toUint8Array(view);
		expect(Array.from(result)).toEqual([1, 2]);
	});

	it("wraps ArrayBuffer", () => {
		const buffer = new Uint8Array([5, 6, 7]).buffer;
		const result = toUint8Array(buffer);
		expect(Array.from(result)).toEqual([5, 6, 7]);
	});
});
