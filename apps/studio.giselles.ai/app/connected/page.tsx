"use client";

import { useEffect } from "react";

export default function () {
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
		}, 600);

		// Clean up the timer when component unmounts
		return () => {
			clearTimeout(timer);
		};
	}, []);
	return (
		<div className="h-screen flex items-center justify-center text-inverse flex-col">
			<p className="text-[24px] mb-[24px]">Connection Completed</p>
			<p className="text-[14px]">This window will close automatically.</p>
		</div>
	);
}
