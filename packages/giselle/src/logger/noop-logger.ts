import type { GiselleLogger } from "./types";

const noop = (..._args: unknown[]): void => {};

export const noopLogger: GiselleLogger = {
	info: noop,
	warn: noop,
	error: noop,
	debug: noop,
};
