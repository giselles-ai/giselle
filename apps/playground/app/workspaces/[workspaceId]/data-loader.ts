import type { WorkspaceId } from "@giselles-ai/protocol";
import { giselle } from "../../../giselle";

export async function dataLoader(workspaceId: WorkspaceId) {
	const data = await giselle.getWorkspace(workspaceId);
	const llmProviders = giselle.getLanguageModelProviders();
	return {
		data,
		llmProviders,
	};
}

export type LoaderData = Awaited<ReturnType<typeof dataLoader>>;
