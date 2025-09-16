export function batchWriter<T>(
	flushFn: (items: T[]) => Promise<void> | void,
	{
		intervalMs = 2000,
		maxItems,
		preserveItems = false,
	}: { intervalMs?: number; maxItems?: number; preserveItems?: boolean } = {},
) {
	let buf: T[] = [];
	let timer: ReturnType<typeof setInterval> | null = null;
	let currentFlush: Promise<void> | null = null;
	let stopped = false;

	const executeFlush = async (items: T[]) => {
		try {
			await flushFn(items);
		} catch (error) {
			// Restore items to buffer on error
			buf = items.concat(buf);
			throw error;
		}
	};

	const tick = async () => {
		if (buf.length === 0) return;

		// Extract items to flush
		const items = buf;
		if (!preserveItems) {
			buf = [];
		}

		// Wait for any ongoing flush to complete
		if (currentFlush) {
			await currentFlush;
		}

		// Execute the flush and track it
		currentFlush = executeFlush(items);

		try {
			await currentFlush;
		} finally {
			currentFlush = null;
		}
	};

	const ensureTimer = () => {
		if (timer) return;
		timer = setInterval(() => {
			tick().catch((e) => console.error("batch flush error:", e));
		}, intervalMs);
	};

	return {
		add(item: T) {
			if (stopped) return;
			buf.push(item);
			ensureTimer();
			if (maxItems && buf.length >= maxItems) {
				tick();
			}
		},
		async flush() {
			await tick();
		},
		async close() {
			if (stopped) return;
			stopped = true;
			if (timer) clearInterval(timer);
			await tick();
		},
	};
}
