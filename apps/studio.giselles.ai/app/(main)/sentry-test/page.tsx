import { SentryTestError } from "@/components/sentry-test-error";

export default function SentryTestPage() {
	return (
		<div className="container mx-auto p-6 space-y-6">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-white mb-4">
					Sentry Error Testing Page
				</h1>
				<p className="text-gray-300">
					This page is for testing Sentry error reporting with user
					identification. Check your Sentry dashboard after clicking the buttons
					below.
				</p>
			</div>

			<SentryTestError />

			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<h3 className="text-lg font-semibold text-blue-800 mb-2">
					How to Test:
				</h3>
				<ol className="list-decimal list-inside space-y-1 text-blue-700">
					<li>Make sure you're logged in to see user ID in Sentry</li>
					<li>Click any error button above</li>
					<li>Check your Sentry dashboard</li>
					<li>Verify that the error includes user information</li>
					<li>Look for the current user ID in the user context</li>
				</ol>
			</div>

			<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
				<h3 className="text-lg font-semibold text-yellow-800 mb-2">
					Expected Behavior:
				</h3>
				<ul className="list-disc list-inside space-y-1 text-yellow-700">
					<li>
						<strong>Logged in:</strong> Errors should include user.id in Sentry
					</li>
					<li>
						<strong>Not logged in:</strong> Errors should not include user
						context
					</li>
					<li>
						<strong>Error details:</strong> Stack trace, component info, and
						browser details
					</li>
				</ul>
			</div>
		</div>
	);
}
