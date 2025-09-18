import type { GenerationId } from "../../concepts/identifiers";
import { generationUiMessageChunksPath } from "../../concepts/path";
import type { GiselleEngineContext } from "../types";

export async function getGenerationMessageChunkss({
	context,
	generationId,
	startByte = 0,
}: {
	context: GiselleEngineContext;
	generationId: GenerationId;
	startByte?: number;
}) {
	const hasExists = await context.experimental_storage.exists(
		generationUiMessageChunksPath(generationId),
	);
	if (!hasExists) {
		return {
			messageChunks: [],
			range: {
				startByte,
				endByte: startByte,
			},
		};
	}
	const messageChunks = await context.experimental_storage.getBlob(
		generationUiMessageChunksPath(generationId),
		{
			range: {
				start: startByte,
			},
		},
	);
	return {
		messageChunks: new TextDecoder()
			.decode(messageChunks)
			.split("\n")
			.filter((chunk) => chunk !== ""),
		range: {
			startByte,
			endByte: startByte + messageChunks.byteLength,
		},
	};
}
