"use client";

import { Button } from "@giselle-internal/ui/button";
import { useEffect } from "react";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error to an error reporting service
		console.error("Stage page error:", error);
	}, [error]);

	return (
		<div className="flex h-screen bg-black-900 items-center justify-center">
			<div className="max-w-md mx-auto text-center p-6">
				<div className="mb-6">
					<h2 className="text-xl font-semibold text-white-100 mb-2">
						Something went wrong
					</h2>
					<p className="text-black-600 text-sm">
						An error occurred while loading the stage page. Please try again.
					</p>
				</div>

				<div className="space-y-3">
					<Button onClick={reset} variant="filled" className="w-full">
						Try again
					</Button>

					<Button
						onClick={() => {
							window.location.assign("/apps");
						}}
						variant="subtle"
						className="w-full"
					>
						Go to Apps
					</Button>
				</div>

				{process.env.NODE_ENV === "development" && (
					<details className="mt-4 text-left">
						<summary className="text-xs text-black-600 cursor-pointer hover:text-white-700">
							Error details (development only)
						</summary>
						<pre className="mt-2 text-xs text-red-400 bg-black-950 p-2 rounded border overflow-auto">
							{error.message}
							{error.stack && `\n\n${error.stack}`}
						</pre>
					</details>
				)}
			</div>
		</div>
	);
}
