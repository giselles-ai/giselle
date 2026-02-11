import { GenerationId } from "@giselles-ai/protocol";
import type { NextRequest } from "next/server";
import { giselle } from "@/app/giselle";
import { verifyApiSecretForTeam } from "@/lib/api-keys/api-secrets";
import { assertWorkspaceAccess } from "@/lib/assert-workspace-access";
import { getWorkspaceTeam } from "@/lib/workspaces/get-workspace-team";

export async function GET(
	request: NextRequest,
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

	const workspaceId = generation.context.origin.workspaceId;

	try {
		await assertWorkspaceAccess(workspaceId);
	} catch {
		const team = await getWorkspaceTeam(workspaceId);
		const verifyResult = await verifyApiSecretForTeam({
			teamDbId: team.dbId,
			authorizationHeader: request.headers.get("authorization"),
		});
		if (!verifyResult.ok) {
			return new Response("Unauthorized", { status: 401 });
		}
	}

	const file = await giselle.getGeneratedImage(parsedGenerationId, filename);

	return new Response(file, {
		headers: {
			"Content-Type": file.type,
			"Content-Disposition": `inline; filename="${file.name}"`,
		},
	});
}
