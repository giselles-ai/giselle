"use client";

import type { TaskId } from "@giselles-ai/protocol";
import { type StreamData, StreamEvent } from "@giselles-ai/stream";
import { useEffect } from "react";

export type StreamDataEventHandler = (data: StreamData) => void;

/**
 * TaskStreamReader - Server-Sent Events (SSE) Stream Handler
 *
 * Flow Diagram:
 * ┌─────────┐    HTTP POST     ┌───────────────┐    SSE Stream    ┌─────────────┐
 * │ Client  │ ─────────────── ▶│ /streamTask    │ ─────────────── ▶│ Stream      │
 * │ React   │                  │ API           │                  │ Processing  │
 * └─────────┘                  └───────────────┘                  └─────────────┘
 *      ▲                              │                                 │
 *      │                              ▼                                 ▼
 *      │                       ┌───────────────┐                 ┌─────────────┐
 *      └───────────────────────│ onUpdateAction│◀────────────────│ Parse Events│
 *                              │ Callback      │                 │ & Handle    │
 *                              └───────────────┘                 └─────────────┘
 *
 * Event Types:
 * - "connected": Initial connection established
 * - "data": New task data available → triggers onUpdateAction
 * - "end": Stream completed naturally
 * - "error": Error occurred in stream
 *
 * SSE Message Handling:
 * - Buffers partial messages across stream chunks
 * - Splits chunks by "\n\n" to extrtask complete SSE messages
 * - Handles network/browser chunk boundaries gracefully
 *
 * Cleanup Strategy:
 * - AbortController: Cancels fetch request on unmount/dependency change
 * - cancelled flag: Stops stream processing loop safely
 * - reader.cancel(): Releases ReadableStream resources
 */
export function TaskStreamReader({
	taskId,
	onUpdateAction,
	children,
}: React.PropsWithChildren<{
	taskId: TaskId;
	onUpdateAction: StreamDataEventHandler;
}>) {
	useEffect(() => {
		// === SETUP PHASE ===
		// Cancellation mechanisms to prevent memory leaks
		let cancelled = false; // Flag to stop processing on cleanup
		const controller = new AbortController(); // Cancels HTTP request

		const obtainAPIResponse = async () => {
			try {
				// === FETCH PHASE ===
				// Establish SSE connection to streaming endpoint
				const apiResponse = await fetch(`/api/giselle/streamTask`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ taskId }),
					signal: controller.signal, // Enable request cancellation
				});

				// Early exit if request was cancelled or no response body
				if (!apiResponse.body || cancelled) return;

				// === STREAM SETUP PHASE ===
				// Convert binary stream to text using TextDecoderStream
				const reader = apiResponse.body
					.pipeThrough(new TextDecoderStream())
					.getReader();

				// Buffer to handle partial messages across chunks
				let buffer = "";

				try {
					// === STREAM PROCESSING PHASE ===
					// Read chunks from the SSE stream until completion or cancellation
					while (!cancelled) {
						const { value, done } = await reader.read();
						if (done || cancelled) break; // Stream ended or component unmounted

						// Append new chunk to buffer
						buffer += value;

						// === MESSAGE PARSING PHASE ===
						// Split by double newline to get complete SSE messages
						const messages = buffer.split("\n\n");

						// Keep the last part (potentially incomplete message) in buffer
						buffer = messages.pop() || "";

						// Process each complete message
						for (const message of messages) {
							const trimmed = message.trim();
							if (!trimmed || !trimmed.startsWith("data:")) continue; // Skip empty or non-data lines

							try {
								// Extrtask JSON payload from SSE message
								const json = trimmed.slice(5).trim(); // Remove "data:" prefix
								const parsed = JSON.parse(json);
								const streamEvent = StreamEvent.parse(parsed); // Validate structure

								if (cancelled) break; // Double-check cancellation before processing

								// === EVENT HANDLING PHASE ===
								// Route different event types to appropriate handlers
								switch (streamEvent.type) {
									case "connected":
										// Connection established - log in development
										if (process.env.NODE_ENV === "development") {
											console.log(`Stream event: ${streamEvent.type}`);
										}
										break;
									case "data":
										// New task data received - notify parent component
										onUpdateAction(streamEvent.data);
										break;
									case "end":
										// Stream completed naturally - no action needed
										break;
									case "error":
										// Server reported an error - throw to catch block
										throw new Error(streamEvent.message);
									default: {
										// TypeScript exhaustiveness check
										const _exhaustiveCheck: never = streamEvent;
										throw new Error(
											`Unhandled stream event type: ${_exhaustiveCheck}`,
										);
									}
								}
							} catch (parseError) {
								// Log parsing errors but continue processing other messages
								console.error("Failed to parse SSE message:", parseError);
							}
						}
					}
				} finally {
					// === CLEANUP PHASE ===
					// Always cancel the reader to release resources
					await reader.cancel();
				}
			} catch (error) {
				// === ERROR HANDLING PHASE ===
				// Only log errors if component is still mounted and error is not from abort
				if (
					!cancelled &&
					error instanceof Error &&
					error.name !== "AbortError" // AbortError is expected during cleanup
				) {
					console.error("Stream error:", error);
				} else if (!cancelled && !(error instanceof Error)) {
					// Handle non-Error objects (though rare in this context)
					console.error("Stream error:", error);
				}
				// Note: AbortErrors and errors after cancellation are silently ignored
			}
		};

		// Start the streaming process
		obtainAPIResponse();

		// === CLEANUP FUNCTION ===
		// Called when component unmounts or dependencies change
		return () => {
			cancelled = true; // Stop processing new messages
			controller.abort(); // Cancel ongoing HTTP request
		};
	}, [taskId, onUpdateAction]); // Re-establish stream when taskId or callback changes

	return children;
}
