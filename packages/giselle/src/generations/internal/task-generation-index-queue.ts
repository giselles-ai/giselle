import type { TaskId } from "@giselles-ai/protocol";
import { NodeGenerationIndex } from "@giselles-ai/protocol";
import type { GiselleStorage } from "@giselles-ai/storage";
import { taskGenerationIndexesPath } from "../../path";
import type { GiselleContext } from "../../types";
import {
	applyPatches,
	type GenerationIndexPatch,
	upsert,
} from "./generation-index-patches";
import { getTaskGenerationIndexes } from "./get-task-generation-indexes";

interface QueuedPatch {
	taskId: TaskId;
	patches: GenerationIndexPatch[];
	timestamp: number;
	retryCount: number;
}

interface QueueState {
	queue: Map<TaskId, QueuedPatch>;
	processing: Set<TaskId>;
	intervalId: NodeJS.Timeout | null;
	retryConfig: RetryConfig;
}

const BATCH_INTERVAL_MS = 50; // Process batches every 50ms
const DEFAULT_MAX_RETRIES = 3; // Maximum number of retry attempts

interface RetryConfig {
	maxRetries: number;
}

// Global state for the patch queue
const state: QueueState = {
	queue: new Map(),
	processing: new Set(),
	intervalId: null,
	retryConfig: { maxRetries: DEFAULT_MAX_RETRIES },
};

/**
 * Processes a batch of patches for a specific taskId
 */
async function processPatchBatch(
	storage: GiselleStorage,
	item: QueuedPatch,
): Promise<void> {
	// Read current indexes
	const currentIndexes = await getTaskGenerationIndexes({
		storage: storage,
		taskId: item.taskId,
	});

	// Apply all patches in batch
	const updatedIndexes = applyPatches(currentIndexes, item.patches);

	// Write back
	await storage.setJson({
		path: taskGenerationIndexesPath(item.taskId),
		data: updatedIndexes,
		schema: NodeGenerationIndex.array(),
	});
}

/**
 * Processes the queue for all pending taskIds
 */
async function processQueue(storage: GiselleStorage) {
	if (state.queue.size === 0) {
		return;
	}

	// Get all items to process
	const itemsToProcess = Array.from(state.queue.entries());

	// Clear the queue
	state.queue.clear();

	// Process each task's patches
	for (const [taskId, item] of itemsToProcess) {
		// Skip if already processing this taskId
		if (state.processing.has(taskId)) {
			// Re-queue for next batch
			const existingItem = state.queue.get(taskId);
			if (existingItem) {
				existingItem.patches.push(...item.patches);
			} else {
				state.queue.set(taskId, item);
			}
			continue;
		}

		state.processing.add(taskId);

		try {
			await processPatchBatch(storage, item);
		} catch (error) {
			// Handle failure with retry logic
			if (item.retryCount < state.retryConfig.maxRetries) {
				// Re-queue with incremented retry count
				const retryItem: QueuedPatch = {
					...item,
					retryCount: item.retryCount + 1,
					timestamp: Date.now(),
				};
				const existingItem = state.queue.get(taskId);
				if (existingItem) {
					// Merge with existing patches
					existingItem.patches.unshift(...retryItem.patches);
					existingItem.retryCount = Math.max(
						existingItem.retryCount,
						retryItem.retryCount,
					);
				} else {
					state.queue.set(taskId, retryItem);
				}
				console.warn(
					`Generation index patch failed for task ${taskId}, retry ${item.retryCount + 1}/${state.retryConfig.maxRetries}:`,
					error,
				);
			} else {
				// Permanent failure - log with severe warning
				console.error(
					`Generation index patch permanently failed for task ${taskId} after ${state.retryConfig.maxRetries} retries. Data loss may occur:`,
					error,
					"Failed patches:",
					item.patches,
				);
			}
		} finally {
			state.processing.delete(taskId);
		}
	}
}

/**
 * Starts the batch processing interval
 */
function startProcessing(storage: GiselleStorage) {
	if (state.intervalId !== null) {
		return;
	}

	state.intervalId = setInterval(() => {
		processQueue(storage).catch((error) => {
			console.error(
				"Unhandled error in generation index queue processing:",
				error,
			);
		});
	}, BATCH_INTERVAL_MS);
}

/**
 * Stops the batch processing interval
 */
function stopProcessing() {
	if (state.intervalId !== null) {
		clearInterval(state.intervalId);
		state.intervalId = null;
	}
}

/**
 * Enqueues a patch for the given taskId
 */
function enqueuePatch(
	storage: GiselleStorage,
	taskId: TaskId,
	patch: GenerationIndexPatch,
) {
	const existingItem = state.queue.get(taskId);

	if (existingItem) {
		// Add to existing patches
		existingItem.patches.push(patch);
	} else {
		// Create new queue item
		state.queue.set(taskId, {
			taskId,
			patches: [patch],
			timestamp: Date.now(),
			retryCount: 0,
		});
	}

	// Start processing if not already started
	startProcessing(storage);
}

/**
 * Flushes all pending patches immediately
 */
export async function flushGenerationIndexQueue({
	context,
	options,
}: {
	options?: { skipRestart?: boolean };
	context: GiselleContext;
}) {
	// Stop the interval to prevent concurrent processing
	stopProcessing();
	context.logger.debug("Flushing generation index queue");
	context.logger.debug(`state.queue.size: ${state.queue.size}`);

	try {
		// Process all pending items
		while (state.queue.size > 0 || state.processing.size > 0) {
			if (state.processing.size > 0) {
				// Wait for current processing to complete
				await new Promise((resolve) => setTimeout(resolve, 10));
				continue;
			}
			await processQueue(context.storage);
		}
	} finally {
		// If skipRestart is true, cleanup instead of restarting
		if (options?.skipRestart) {
			cleanupGenerationIndexQueue();
		} else {
			// Restart the interval
			startProcessing(context.storage);
		}
	}
}

/**
 * Public API for updating task generation indexes
 */
export function updateTaskGenerationIndexes(
	storage: GiselleStorage,
	taskId: TaskId,
	newIndex: NodeGenerationIndex,
) {
	// Create an upsert patch
	const patch = upsert(newIndex);

	// Enqueue the patch
	enqueuePatch(storage, taskId, patch);
}

// Cleanup function for tests or shutdown
function cleanupGenerationIndexQueue() {
	stopProcessing();
	state.queue.clear();
	state.processing.clear();
}
