import type { NextResponse } from "next/server";

// biome-ignore lint: lint/suspicious/noExplicitAny
export type InferResponse<T extends (...args: any) => any> = Awaited<
	ReturnType<T>
> extends NextResponse<infer U>
	? U
	: never;
