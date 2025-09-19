export function assertNotAborted(signal?: AbortSignal): void {
	if (!signal) {
		return;
	}
	if (typeof signal.throwIfAborted === "function") {
		signal.throwIfAborted();
		return;
	}
	if (signal.aborted) {
		const reason =
			signal.reason instanceof Error
				? signal.reason
				: new Error("Operation aborted");
		reason.name = "AbortError";
		throw reason;
	}
}
