"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryTestPage() {
	const [status, setStatus] = useState<string>("");

	const handleClientError = () => {
		const error = new Error("Sentry client-side test error");
		Sentry.captureException(error);
		setStatus("Client-side error sent to Sentry");
	};

	const handleUnhandledError = () => {
		throw new Error("Sentry client-side unhandled error test");
	};

	const handleServerError = async () => {
		setStatus("Sending...");
		const res = await fetch("/api/sentry-test/server");
		const data = await res.json();
		setStatus(`Server response: ${data.message}`);
	};

	const handleServerUnhandledError = async () => {
		setStatus("Sending...");
		try {
			await fetch("/api/sentry-test/server", { method: "POST" });
		} catch {
			setStatus("Server unhandled error triggered");
		}
	};

	return (
		<div style={{ padding: "2rem" }}>
			<h1>Sentry Test Page</h1>
			<p>Use these buttons to test Sentry error reporting:</p>

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
					marginTop: "1rem",
				}}
			>
				<button type="button" onClick={handleClientError}>
					Trigger Client Error (captured)
				</button>

				<button type="button" onClick={handleUnhandledError}>
					Trigger Client Unhandled Error
				</button>

				<button type="button" onClick={handleServerError}>
					Trigger Server Error (captured)
				</button>

				<button type="button" onClick={handleServerUnhandledError}>
					Trigger Server Unhandled Error
				</button>
			</div>

			{status && (
				<p
					style={{ marginTop: "1rem", padding: "1rem", background: "#f0f0f0" }}
				>
					{status}
				</p>
			)}
		</div>
	);
}
