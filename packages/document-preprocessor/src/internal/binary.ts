import type { BinaryDataInput } from "../types.js";

export function toUint8Array(input: BinaryDataInput): Uint8Array {
	if (input instanceof Uint8Array) {
		return input;
	}
	if (ArrayBuffer.isView(input)) {
		return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
	}
	return new Uint8Array(input);
}
