import { head } from "@vercel/blob";
import invariant from "tiny-invariant";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const blobUrl = searchParams.get("url");
	invariant(blobUrl != null, "url is required");
	const blobDetails = await head(blobUrl);

	return Response.json(blobDetails);
}
