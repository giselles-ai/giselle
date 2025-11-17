import type { TaskId } from "@giselles-ai/protocol";
import type { StreamData, StreamEvent } from "@giselles-ai/stream";
import type { GiselleContext } from "../types";
import { getTask } from "./get-task";

function createDataHash(data: StreamData): string {
	// Create a simple hash of the data to detect changes
	return JSON.stringify({
		taskUpdatedAt: data.task.updatedAt,
	});
}

export function formatStreamData(event: StreamEvent): string {
	return `data: ${JSON.stringify(event)}\n\n`;
}

export function streamTask(args: { taskId: TaskId; context: GiselleContext }) {
	const encoder = new TextEncoder();

	let pollIntervalId: ReturnType<typeof setInterval> | null = null;
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let polling = true;

	const cleanupResources = () => {
		polling = false;

		if (pollIntervalId) {
			clearInterval(pollIntervalId);
			pollIntervalId = null;
		}

		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	return new ReadableStream({
		async start(controller) {
			let lastDataHash = "";
			let lastFetchedData: StreamData | null = null;

			// Send connection established event
			controller.enqueue(
				encoder.encode(formatStreamData({ type: "connected" })),
			);

			const sendUpdate = async () => {
				if (!polling || controller.desiredSize === null) {
					return;
				}

				try {
					lastFetchedData = {
						task: await getTask({ taskId: args.taskId, context: args.context }),
					};
					const currentHash = createDataHash(lastFetchedData);

					if (currentHash === lastDataHash) {
						return;
					}
					lastDataHash = currentHash;

					controller.enqueue(
						encoder.encode(
							formatStreamData({
								type: "data",
								data: lastFetchedData,
							}),
						),
					);
				} catch (error) {
					console.error("Error fetching task and generations:", error);
					lastFetchedData = null;

					// Only send error if controller is still taskive
					try {
						controller.enqueue(
							encoder.encode(
								formatStreamData({
									type: "error",
									message: "Failed to fetch data",
								}),
							),
						);
					} catch {
						// Ignore if controller is already closed
					}
				}
			};

			const cleanup = () => {
				cleanupResources();

				// Send end message and close if controller is still taskive
				if (controller.desiredSize !== null) {
					controller.enqueue(encoder.encode(formatStreamData({ type: "end" })));
					controller.close();
				}
			};

			const poll = async () => {
				if (!polling || controller.desiredSize === null) {
					return;
				}

				await sendUpdate();

				if (lastFetchedData?.task.status === "completed") {
					cleanup();
				}
			};

			// Execute immediately first
			await poll();

			// Only set up polling if we haven't cleaned up already
			if (polling) {
				pollIntervalId = setInterval(poll, 500);
				timeoutId = setTimeout(cleanup, 20 * 60 * 1000);
			}
		},

		cancel() {
			cleanupResources();
		},
	});
}
