"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export function SentryUnauthenticatedTest() {
	const [testResult, setTestResult] = useState<string>("");

	const handleTestError = () => {
		// Check Sentry user context before throwing error
		const currentScope = Sentry.getCurrentScope();
		const currentUser = currentScope.getUser();

		console.log("Sentry user context before error:", currentUser);
		setTestResult(
			`Sentry user context: ${
				currentUser === null ||
				currentUser === undefined ||
				Object.keys(currentUser).length === 0
					? "✅ Correctly empty (no user set)"
					: `❌ Unexpected user data: ${JSON.stringify(currentUser)}`
			}`,
		);

		// Throw test error for unauthenticated user
		throw new Error(
			"Test Error from Unauthenticated User - Should have no user context in Sentry",
		);
	};

	return (
		<div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
			<h4 className="text-sm font-semibold text-orange-800 mb-2">
				🔍 Sentry Unauthenticated User Test
			</h4>
			<button
				type="button"
				onClick={handleTestError}
				className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 mb-2"
			>
				Test Unauthenticated Error
			</button>
			{testResult && (
				<div className="text-xs text-orange-700 mt-2">{testResult}</div>
			)}
			<p className="text-xs text-orange-600 mt-2">
				This should generate an error with <strong>no user context</strong> in
				Sentry. Check both console and Sentry dashboard.
			</p>
		</div>
	);
}
