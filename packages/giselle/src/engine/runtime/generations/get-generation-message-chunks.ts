import type { GenerationId } from "@giselles-ai/protocol";
import type { GiselleEngineContext } from "../../contracts";
import { generationUiMessageChunksPath } from "../path";

export async function getGenerationMessageChunkss({
	context,
	generationId,
	startByte = 0,
}: {
	context: GiselleEngineContext;
	generationId: GenerationId;
	startByte?: number;
}) {
	const hasExists = await context.storage.exists(
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
	try {
		const contentLength = await context.storage.contentLength(
			generationUiMessageChunksPath(generationId),
		);
		if (startByte === contentLength) {
			return {
				messageChunks: [],
				range: {
					startByte,
					endByte: startByte,
				},
			};
		}
		const messageChunks = await context.storage.getBlob(
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
	} catch (error) {
		context.logger.error(error);
		return {
			messageChunks: [],
			range: {
				startByte,
				endByte: startByte,
			},
		};
	}
}
