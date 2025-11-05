import type { ActId } from "../../../concepts";
import { NodeGenerationIndex } from "../../../concepts";
import { actGenerationIndexesPath } from "../../../concepts/path";
import type { GiselleStorage } from "../../storage";
import type { GiselleEngineContext } from "../../types";
import {
	applyPatches,
	type GenerationIndexPatch,
	upsert,
} from "./generation-index-patches";
import { getActGenerationIndexes } from "./get-act-generation-indexes";

interface QueuedPatch {
	actId: ActId;
	patches: GenerationIndexPatch[];
	timestamp: number;
	retryCount: number;
}

interface QueueState {
	queue: Map<ActId, QueuedPatch>;
	processing: Set<ActId>;
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
 * Processes a batch of patches for a specific actId
 */
async function processPatchBatch(
	storage: GiselleStorage,
	item: QueuedPatch,
): Promise<void> {
	// Read current indexes
	const currentIndexes = await getActGenerationIndexes({
		storage: storage,
		actId: item.actId,
	});

	// Apply all patches in batch
	const updatedIndexes = applyPatches(currentIndexes, item.patches);

	// Write back
	await storage.setJson({
		path: actGenerationIndexesPath(item.actId),
		data: updatedIndexes,
		schema: NodeGenerationIndex.array(),
	});
}

/**
 * Processes the queue for all pending actIds
 */
async function processQueue(storage: GiselleStorage) {
	if (state.queue.size === 0) {
		return;
	}

	// Get all items to process
	const itemsToProcess = Array.from(state.queue.entries());

	// Clear the queue
	state.queue.clear();

	// Process each act's patches
	for (const [actId, item] of itemsToProcess) {
		// Skip if already processing this actId
		if (state.processing.has(actId)) {
			// Re-queue for next batch
			const existingItem = state.queue.get(actId);
			if (existingItem) {
				existingItem.patches.push(...item.patches);
			} else {
				state.queue.set(actId, item);
			}
			continue;
		}

		state.processing.add(actId);

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
				const existingItem = state.queue.get(actId);
				if (existingItem) {
					// Merge with existing patches
					existingItem.patches.unshift(...retryItem.patches);
					existingItem.retryCount = Math.max(
						existingItem.retryCount,
						retryItem.retryCount,
					);
				} else {
					state.queue.set(actId, retryItem);
				}
				console.warn(
					`Generation index patch failed for act ${actId}, retry ${item.retryCount + 1}/${state.retryConfig.maxRetries}:`,
					error,
				);
			} else {
				// Permanent failure - log with severe warning
				console.error(
					`Generation index patch permanently failed for act ${actId} after ${state.retryConfig.maxRetries} retries. Data loss may occur:`,
					error,
					"Failed patches:",
					item.patches,
				);
			}
		} finally {
			state.processing.delete(actId);
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
 * Enqueues a patch for the given actId
 */
function enqueuePatch(
	storage: GiselleStorage,
	actId: ActId,
	patch: GenerationIndexPatch,
) {
	const existingItem = state.queue.get(actId);

	if (existingItem) {
		// Add to existing patches
		existingItem.patches.push(patch);
	} else {
		// Create new queue item
		state.queue.set(actId, {
			actId,
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
	context: GiselleEngineContext;
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
 * Public API for updating act generation indexes
 */
export function updateActGenerationIndexes(
	storage: GiselleStorage,
	actId: ActId,
	newIndex: NodeGenerationIndex,
) {
	// Create an upsert patch
	const patch = upsert(newIndex);

	// Enqueue the patch
	enqueuePatch(storage, actId, patch);
}

// Cleanup function for tests or shutdown
function cleanupGenerationIndexQueue() {
	stopProcessing();
	state.queue.clear();
	state.processing.clear();
}
