import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * @link https://docs.unstructured.io/api-reference/api-services/supported-file-types
 */
const allowedContentTypes = [
	"application/csv",
	"message/rfc822",
	"application/epub+zip",
	"application/vnd.ms-excel",
	"text/html",
	"text/markdown",
	"text/org",
	"application/vnd.oasis.opendocument.text",
	"application/pdf",
	"text/plain",
	"application/vnd.ms-powerpoint",
	"text/x-rst",
	"application/rtf",
	"text/tab-separated-values",
	"application/msword",
	"application/xml",
];

export async function POST(request: Request): Promise<NextResponse> {
	const body = (await request.json()) as HandleUploadBody;

	try {
		const jsonResponse = await handleUpload({
			body,
			request,
			onBeforeGenerateToken: async (
				pathname,
				/* clientPayload */
			) => {
				return {
					allowedContentTypes,
				};
			},
			onUploadCompleted: async () => {},
		});

		return NextResponse.json(jsonResponse);
	} catch (error) {
		return NextResponse.json(
			{ error: (error as Error).message },
			{ status: 400 }, // The webhook will retry 5 times waiting for a 200
		);
	}
}
