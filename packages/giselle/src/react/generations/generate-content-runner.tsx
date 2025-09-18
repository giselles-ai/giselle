import { createUIMessageStream, readUIMessageStream } from "ai";
import { useCallback, useEffect, useRef } from "react";
import type { Generation } from "../../concepts/generation";
import { useGiselleEngine } from "../use-giselle-engine";
import { useGenerationRunnerSystem } from "./contexts";
import { useGenerationStore } from "./store";

// Based on: https://github.com/vercel/ai/blob/4a2b70e03bbb552e7d130cec7f8cbfcb96bdc03f/packages/ai/src/ui-message-stream/ui-message-chunks.ts#L14-L154
type StreamEndChunk =
	| { type: "finish" }
	| { type: "abort" }
	| { type: "error"; errorText: string };

function isStreamEndChunk(chunk: unknown): chunk is StreamEndChunk {
	if (
		typeof chunk !== "object" ||
		chunk === null ||
		!("type" in chunk) ||
		typeof (chunk as Record<string, unknown>).type !== "string"
	) {
		return false;
	}

	const chunkType = (chunk as Record<string, unknown>).type as string;

	if (!["finish", "abort", "error"].includes(chunkType)) {
		return false;
	}

	// For error chunks, validate that errorText is present
	if (chunkType === "error") {
		return (
			"errorText" in chunk &&
			typeof (chunk as Record<string, unknown>).errorText === "string"
		);
	}

	return true;
}

type GenerateContentOnFinishCallback = (options: {
	isAbort: boolean;
	isError: boolean;
}) => void;

type GenerateContentOnErrorCallback = (error: Error) => void;

export function GenerateContentRunner({
	generation,
	onFinish,
	onError,
}: {
	generation: Generation;
	onFinish?: GenerateContentOnFinishCallback;
	onError?: GenerateContentOnErrorCallback;
}) {
	const client = useGiselleEngine();
	const upsertMessage = useGenerationStore((s) => s.upsertMessage);
	const updateGeneration = useGenerationStore((s) => s.updateGeneration);
	const { addStopHandler, updateGenerationStatusToComplete } =
		useGenerationRunnerSystem();
	const didRun = useRef(false);
	const reachedStreamEnd = useRef(false);
	const processStream = useCallback(async () => {
		const stream = createUIMessageStream({
			onError: (error) => {
				console.error(error);
				return "error";
			},
			async execute({ writer }) {
				let startByte = 0;
				while (!reachedStreamEnd.current) {
					console.log(`get chunk from: ${startByte}`);
					const data = await client.getGenerationMessageChunks({
						generationId: generation.id,
						startByte,
					});
					console.log(`received chunk: ${data.messageChunks.length}`);
					for (const chunk of data.messageChunks) {
						console.log("chunk is", chunk);
						const messageChunk = JSON.parse(chunk);
						console.log(`write message: ${chunk}`);
						writer.write(messageChunk);
						startByte = data.range.endByte;
						console.log(`isStreamEndChunk: ${isStreamEndChunk(messageChunk)}`);
						if (isStreamEndChunk(messageChunk)) {
							console.log(`chunk type: ${messageChunk.type}`);
							reachedStreamEnd.current = true;
							switch (messageChunk.type) {
								case "abort":
									onFinish?.({
										isAbort: true,
										isError: false,
									});
									break;
								case "finish":
									await updateGenerationStatusToComplete(generation.id);
									onFinish?.({
										isAbort: false,
										isError: false,
									});
									break;
								case "error":
									onError?.(new Error(messageChunk.errorText));
									onFinish?.({
										isAbort: false,
										isError: true,
									});
									break;
							}
						}
					}
					console.log(`finished processing chunks`);
					await new Promise((resolve) => setTimeout(resolve, 1000 * 5));
					console.log(`next tick with: ${startByte}`);
				}
			},
		});

		for await (const message of readUIMessageStream({ stream })) {
			console.log("upsert message", message);
			upsertMessage(generation.id, message);
		}
	}, [
		generation.id,
		client.getGenerationMessageChunks,
		upsertMessage,
		onFinish,
		onError,
		updateGenerationStatusToComplete,
	]);

	useEffect(() => {
		if (generation.status !== "queued") {
			return;
		}
		if (didRun.current) {
			return;
		}
		didRun.current = true;
		addStopHandler(generation.id, stop);
		client.generateContent({ generation }).then(({ generation }) => {
			updateGeneration(generation);
			processStream();
		});
	}, [generation, addStopHandler, client, processStream, updateGeneration]);
	return null;
}
