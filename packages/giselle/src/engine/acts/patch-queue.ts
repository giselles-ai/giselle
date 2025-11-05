import type { ActId } from "../../concepts";
import type { GiselleEngineContext } from "../types";
import { type Patch, patchAct } from "./patch-act";

interface QueuedPatch {
	actId: ActId;
	patches: Patch[];
	timestamp: number;
	retryCount: number;
}

interface PatchQueueState {
	queue: QueuedPatch[];
	processing: boolean;
	intervalId: NodeJS.Timeout | null;
	context: GiselleEngineContext;
	retryConfig: RetryConfig;
}

const BATCH_INTERVAL_MS = 50; // Process batches every 50ms
const DEFAULT_MAX_RETRIES = 3; // Maximum number of retry attempts

interface RetryConfig {
	maxRetries: number;
}

/**
 * Creates a patch queue system for managing concurrent patch operations
 * Ensures patches are applied in FIFO order and prevents race conditions
 */
export function createPatchQueue(
	context: GiselleEngineContext,
	retryConfig: RetryConfig = { maxRetries: DEFAULT_MAX_RETRIES },
) {
	const state: PatchQueueState = {
		queue: [],
		processing: false,
		intervalId: null,
		context,
		retryConfig,
	};

	/**
	 * Groups queued patches by actId without merging
	 */
	function processBatch() {
		if (state.queue.length === 0) {
			return [];
		}

		// Group patches by actId while preserving order and tracking retry counts
		const actGroups = new Map<
			string,
			{ actId: ActId; patches: Patch[]; maxRetryCount: number }
		>();

		for (const item of state.queue) {
			const actIdStr = item.actId;
			const existing = actGroups.get(actIdStr);

			if (existing) {
				existing.patches.push(...item.patches);
				// Keep the maximum retry count when batching items
				existing.maxRetryCount = Math.max(
					existing.maxRetryCount,
					item.retryCount,
				);
			} else {
				actGroups.set(actIdStr, {
					actId: item.actId,
					patches: [...item.patches],
					maxRetryCount: item.retryCount,
				});
			}
		}

		const batch = Array.from(actGroups.values()).map((group) => ({
			actId: group.actId,
			patches: group.patches,
			timestamp: Date.now(),
			retryCount: group.maxRetryCount,
		}));

		// Clear the queue
		state.queue = [];

		return batch;
	}

	/**
	 * Processes the current batch of patches
	 */
	async function processQueue() {
		if (state.processing || state.queue.length === 0) {
			return;
		}

		state.processing = true;

		try {
			const batch = processBatch();

			// Process each act's patches sequentially to maintain order
			for (const item of batch) {
				try {
					await patchAct({
						context: state.context,
						actId: item.actId,
						patches: item.patches,
					});
				} catch (error) {
					// Handle individual patch failures
					if (item.retryCount < state.retryConfig.maxRetries) {
						// Re-queue at the front with incremented retry count
						const retryItem: QueuedPatch = {
							...item,
							retryCount: item.retryCount + 1,
							timestamp: Date.now(),
						};
						state.queue.unshift(retryItem);
						console.warn(
							`Patch failed for act ${item.actId}, retry ${item.retryCount + 1}/${state.retryConfig.maxRetries}:`,
							error,
						);
					} else {
						// Permanent failure - log with severe warning
						console.error(
							`Patch permanently failed for act ${item.actId} after ${state.retryConfig.maxRetries} retries. Data loss may occur:`,
							error,
							"Failed patches:",
							item.patches,
						);
					}
				}
			}
		} catch (error) {
			console.error("Error processing patch queue:", error);
		} finally {
			state.processing = false;
		}
	}

	/**
	 * Starts the batch processing interval
	 */
	function startProcessing() {
		if (state.intervalId !== null) {
			return;
		}

		state.intervalId = setInterval(() => {
			processQueue().catch((error) => {
				console.error("Unhandled error in patch queue processing:", error);
			});
		}, BATCH_INTERVAL_MS);
	}

	/**
	 * Stops the batch processing and cleans up resources
	 * Discards any remaining patches without processing them
	 */
	function cleanup() {
		if (state.intervalId !== null) {
			clearInterval(state.intervalId);
			state.intervalId = null;
		}

		// Clear the queue without processing remaining patches
		// Since cleanup indicates end of act execution, remaining patches
		// likely represent incomplete or invalid state changes
		if (state.queue.length > 0) {
			console.warn(
				`Discarding ${state.queue.length} unprocessed patches during cleanup`,
			);
		}
		state.queue = [];
	}

	/**
	 * Adds patches to the queue for processing
	 */
	function enqueuePatch(actId: ActId, patches: Patch[]) {
		if (patches.length === 0) {
			return;
		}

		state.queue.push({
			actId,
			patches,
			timestamp: Date.now(),
			retryCount: 0,
		});

		// Start processing if not already started
		startProcessing();
	}

	/**
	 * Creates an applyPatches function that uses the queue
	 */
	function createApplyPatches() {
		return (actId: ActId, patches: Patch[]) => {
			enqueuePatch(actId, patches);
		};
	}

	/**
	 * Immediately processes all queued patches
	 * Returns a promise that resolves when all patches are processed
	 */
	async function flush() {
		while (state.queue.length > 0) {
			if (state.processing) {
				// Wait for current processing to complete
				await new Promise((resolve) => setTimeout(resolve, 10));
				continue;
			}
			await processQueue();
		}
	}

	return {
		createApplyPatches,
		cleanup,
		flush,
		// Exposed for testing
		_internal: {
			getQueueLength: () => state.queue.length,
			isProcessing: () => state.processing,
			processQueue,
		},
	};
}
