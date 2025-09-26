import type { GiselleLogger } from "../logger/types";

export function batchWriter<T>({
	process,
	intervalMs = 2000,
	maxItems,
	preserveItems = false,
	logger,
}: {
	process: (items: T[]) => Promise<void> | void;
	intervalMs?: number;
	maxItems?: number;
	preserveItems?: boolean;
	logger?: GiselleLogger;
}) {
	let buf: T[] = [];
	let timer: ReturnType<typeof setInterval> | null = null;
	let currentFlush: Promise<void> | null = null;
	let stopped = false;

	logger?.debug(
		`batchWriter initialized: intervalMs=${intervalMs}, maxItems=${maxItems}, preserveItems=${preserveItems}`,
	);

	const executeFlush = async (items: T[]) => {
		logger?.debug(`executeFlush starting with ${items.length} items`);
		try {
			await process(items);
			logger?.debug(
				`executeFlush completed successfully for ${items.length} items`,
			);
		} catch (error) {
			logger?.error(`executeFlush failed for ${items.length} items`);
			// Restore items to buffer on error only if preserveItems is false
			if (!preserveItems) {
				buf = items.concat(buf);
				logger?.debug(`Restored ${items.length} items to buffer due to error`);
			}
			throw error;
		}
	};

	const tick = async () => {
		logger?.debug(`tick called with buffer length: ${buf.length}`);
		if (buf.length === 0) {
			logger?.debug("tick: buffer is empty, returning");
			return;
		}

		// Extract items to flush
		const items = [...buf];
		if (!preserveItems) {
			buf = [];
		}
		logger?.debug(
			`tick: extracted ${items.length} items for flushing, preserveItems: ${preserveItems}`,
		);

		// Wait for any ongoing flush to complete
		if (currentFlush) {
			logger?.debug("tick: waiting for ongoing flush to complete");
			await currentFlush;
		}

		// Execute the flush and track it
		currentFlush = executeFlush(items);

		try {
			await currentFlush;
			logger?.debug("tick: flush completed successfully");
		} finally {
			currentFlush = null;
		}
	};

	const ensureTimer = () => {
		if (timer) {
			logger?.debug("ensureTimer: timer already exists");
			return;
		}
		logger?.debug(`ensureTimer: creating timer with interval ${intervalMs}ms`);
		timer = setInterval(() => {
			tick().catch((e) => {
				logger?.error("batch flush error:", e);
				console.error("batch flush error:", e);
			});
		}, intervalMs);
	};

	return {
		add(item: T) {
			if (stopped) {
				logger?.debug("add: writer is stopped, ignoring item");
				return;
			}
			buf.push(item);
			logger?.debug(`add: item added, buffer length now: ${buf.length}`);
			ensureTimer();
			if (maxItems && buf.length >= maxItems) {
				logger?.debug(
					`add: buffer reached maxItems (${maxItems}), triggering tick`,
				);
				tick();
			}
		},
		async flush() {
			logger?.debug("flush: manual flush triggered");
			await tick();
		},
		async close() {
			if (stopped) {
				logger?.debug("close: writer already stopped");
				return;
			}
			logger?.debug("close: stopping writer and clearing timer");
			stopped = true;
			if (timer) clearInterval(timer);
			await tick();
			logger?.debug("close: writer closed successfully");
		},
	};
}
