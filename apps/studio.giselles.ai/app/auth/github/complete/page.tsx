"use client";

import { Suspense } from "react";
import { GitHubAuthCompleteClient } from "./github-auth-complete-client";

function LoadingFallback() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
			<div className="flex flex-col items-center max-w-md">
				<p>Loading...</p>
			</div>
		</div>
	);
}

export default function GitHubAuthComplete() {
	return (
		<Suspense fallback={<LoadingFallback />}>
			<GitHubAuthCompleteClient />
		</Suspense>
	);
}
