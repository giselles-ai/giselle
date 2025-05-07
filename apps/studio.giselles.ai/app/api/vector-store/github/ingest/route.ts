import type { NextRequest } from "next/server";

// ingest GitHub Code
// TODO: implement as a worker
export async function GET(request: NextRequest) {
	return new Response("Hello, world!", { status: 200 });
}
