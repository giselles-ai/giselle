import { createUIMessageStream, readUIMessageStream, type UIMessage } from "ai";
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
	const messageUpdateQueue = useRef<Map<UIMessage["id"], UIMessage>>(new Map());
	const pendingUpdate = useRef<number | null>(null);

	const flushMessageUpdates = useCallback(() => {
		if (messageUpdateQueue.current.size === 0) return;

		const updates = Array.from(messageUpdateQueue.current.values());
		messageUpdateQueue.current.clear();

		// Apply the latest message for each message ID
		for (const message of updates) {
			upsertMessage(generation.id, message);
		}

		pendingUpdate.current = null;
	}, [generation.id, upsertMessage]);

	const scheduleMessageUpdate = useCallback(
		(message: UIMessage) => {
			// Queue the message update (latest message per ID wins)
			messageUpdateQueue.current.set(message.id, message);

			// Schedule a flush if not already scheduled
			if (pendingUpdate.current === null) {
				pendingUpdate.current = requestAnimationFrame(flushMessageUpdates);
			}
		},
		[flushMessageUpdates],
	);
	const processStream = useCallback(async () => {
		const stream = createUIMessageStream({
			onError: (error) => {
				console.error(error);
				return "error";
			},
			async execute({ writer }) {
				let startByte = 0;
				while (!reachedStreamEnd.current) {
					const data = await client.getGenerationMessageChunks({
						generationId: generation.id,
						startByte,
					});
					for (const chunk of data.messageChunks) {
						const messageChunk = JSON.parse(chunk);
						writer.write(messageChunk);
						startByte = data.range.endByte;
						if (isStreamEndChunk(messageChunk)) {
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
					await new Promise((resolve) => setTimeout(resolve, 1000 * 5));
				}
			},
		});

		for await (const message of readUIMessageStream({ stream })) {
			scheduleMessageUpdate(message);
		}

		// Ensure any remaining updates are flushed when stream ends
		if (pendingUpdate.current !== null) {
			cancelAnimationFrame(pendingUpdate.current);
			flushMessageUpdates();
		}
	}, [
		generation.id,
		client.getGenerationMessageChunks,
		scheduleMessageUpdate,
		flushMessageUpdates,
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
