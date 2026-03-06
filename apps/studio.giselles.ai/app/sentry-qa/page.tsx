"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryQAPage() {
	const [clientResult, setClientResult] = useState<string | null>(null);
	const [serverResult, setServerResult] = useState<string | null>(null);

	function triggerClientError() {
		try {
			throw new Error("Manual QA Sentry Client Test");
		} catch (error) {
			Sentry.captureException(error);
			setClientResult(
				"Client error sent to Sentry. Check the Sentry dashboard.",
			);
		}
	}

	async function triggerServerError() {
		setServerResult("Sending...");
		try {
			const res = await fetch("/api/sentry-qa");
			const data = await res.json();
			setServerResult(data.message);
		} catch {
			setServerResult("Request failed — check server logs.");
		}
	}

	return (
		<div style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 600 }}>
			<h1>Sentry QA</h1>

			<section style={{ marginTop: 32 }}>
				<h2>Client-side Error</h2>
				<button type="button" onClick={triggerClientError} style={buttonStyle}>
					Trigger Client Error
				</button>
				{clientResult && <p>{clientResult}</p>}
			</section>

			<section style={{ marginTop: 32 }}>
				<h2>Server-side Error</h2>
				<button type="button" onClick={triggerServerError} style={buttonStyle}>
					Trigger Server Error
				</button>
				{serverResult && <p>{serverResult}</p>}
			</section>
		</div>
	);
}

const buttonStyle = {
	padding: "8px 16px",
	fontSize: 14,
	cursor: "pointer",
} as const;
