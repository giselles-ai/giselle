import type { NextRequest } from "next/server";

export function GET(req: NextRequest) {
	const url = new URL(req.url);
	console.error(`error log test 1: ${url.pathname}`);
	console.error(`error log test 2: ${url.pathname}`, { userId: 1234 });
	return new Response("Hello World");
}
