"use client";

import { useEffect } from "react";

export function SuccessPage() {
	useEffect(() => {
		// Send a message to the opener window
		if (window.opener && !window.opener.closed) {
			window.opener.postMessage(
				{ type: "github-app-installed", success: true },
				"*",
			);
		}
		// Close the popup window after 2 seconds
		const timer = setTimeout(() => {
			window.close();
		}, 2000);

		// Clean up the timer when component unmounts
		return () => {
			clearTimeout(timer);
		};
	}, []);
	return (
		<>
			<p className="message success-message">
				GitHub App installed successfully!
			</p>
			<p className="sub-message">This window will close automatically.</p>
		</>
	);
}

export function FailurePage({ errorMessage }: { errorMessage: string | null }) {
	useEffect(() => {
		// Send a message to the opener window
		if (window.opener && !window.opener.closed) {
			window.opener.postMessage(
				{ type: "github-app-installed", success: false },
				"*",
			);
		}
		// Close the popup window after 2 seconds
		const timer = setTimeout(() => {
			window.close();
		}, 2000);

		// Clean up the timer when component unmounts
		return () => {
			clearTimeout(timer);
		};
	}, []);
	return (
		<>
			<p className="message error-message">GitHub App installation failed!</p>
			{errorMessage && <p className="sub-message">{errorMessage}</p>}
		</>
	);
}
