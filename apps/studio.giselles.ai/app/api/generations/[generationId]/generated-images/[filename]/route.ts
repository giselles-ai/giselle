import { GenerationId } from "@giselles-ai/protocol";
import type { NextRequest } from "next/server";
import { giselle } from "@/app/giselle";
import { assertWorkspaceAccess } from "@/lib/assert-workspace-access";

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
	const parsedGenerationId = GenerationId.parse(generationId);
	const generation = await giselle.getGeneration(parsedGenerationId);

	await assertWorkspaceAccess(generation.context.origin.workspaceId);

	const file = await giselle.getGeneratedImage(parsedGenerationId, filename);

	return new Response(file, {
		headers: {
			"Content-Type": file.type,
			"Content-Disposition": `inline; filename="${file.name}"`,
		},
	});
}
