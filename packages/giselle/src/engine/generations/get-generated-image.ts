import type { GenerationId } from "../../concepts/identifiers";
import type { GiselleEngineContext } from "../types";
import {
	detectImageType,
	getGeneratedImage as getGeneratedImageInternal,
	getGeneration,
} from "./utils";

export async function getGeneratedImage(args: {
	context: GiselleEngineContext;
	generationId: GenerationId;
	filename: string;
	useExperimentalStorage: boolean;
}) {
	const generation = await getGeneration({
		storage: args.context.deprecated_storage,
		experimental_storage: args.context.storage,
		useExperimentalStorage: args.useExperimentalStorage,
		generationId: args.generationId,
	});
	if (generation?.status !== "completed") {
		throw new Error(`Generation ${args.generationId} is not completed`);
	}
	const generatedImage = await getGeneratedImageInternal({
		storage: args.context.deprecated_storage,
		experimental_storage: args.context.storage,
		useExperimentalStorage: args.useExperimentalStorage,
		generation,
		filename: args.filename,
	});
	const imageType = detectImageType(generatedImage);
	if (imageType === null) {
		throw new Error("Image type could not be detected");
	}
	return new File([generatedImage], args.filename, {
		type: imageType.contentType,
	});
}
