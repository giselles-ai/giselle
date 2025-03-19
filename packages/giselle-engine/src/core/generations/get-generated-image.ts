import type { GenerationId } from "@giselle-sdk/data-type";
import type { GiselleEngineContext } from "../types";
import {
	getGeneratedImage as getGeneratedImageInternal,
	getGeneration,
} from "./utils";

export async function getGeneratedImage(args: {
	context: GiselleEngineContext;
	generationId: GenerationId;
	filename: string;
}) {
	const generation = await getGeneration({
		storage: args.context.storage,
		generationId: args.generationId,
	});
	if (generation?.status !== "completed") {
		throw new Error(`Generation ${args.generationId} is not completed`);
	}
	return await getGeneratedImageInternal({
		storage: args.context.storage,
		generation,
		filename: args.filename,
	});
}
