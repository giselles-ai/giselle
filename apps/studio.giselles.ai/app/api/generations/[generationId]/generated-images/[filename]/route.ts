import { GenerationId } from "@giselles-ai/protocol";
import type { NextRequest } from "next/server";
import { giselle } from "@/app/giselle";

export async function GET(
	_request: NextRequest,
	{
		params,
	}: {
		params: Promise<{
			generationId: string;
			filename: string;
		}>;
	},
) {
	const { generationId, filename } = await params;
	const file = await giselle.getGeneratedImage(
		GenerationId.parse(generationId),
		filename,
	);
	return new Response(file, {
		headers: {
			"Content-Type": file.type,
			"Content-Disposition": `inline; filename="${file.name}"`,
		},
	});
}
