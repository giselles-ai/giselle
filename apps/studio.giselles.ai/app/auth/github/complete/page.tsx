"use client";

import { Button } from "@/components/v2/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function GitHubAuthComplete() {
	const searchParams = useSearchParams();
	const status = searchParams.get("status");
	const message = searchParams.get("message");
	const isSuccess = status !== "error";

	useEffect(() => {
		// Refresh parent window component when this page loads
		if (window.opener) {
			// Use router.refresh() in the parent window instead of full page reload
			if (window.opener.postMessage) {
				window.opener.postMessage(
					{ type: "GITHUB_AUTH_COMPLETE", status, message },
					"*",
				);
			}
		}
	}, [status, message]);

	const handleClose = () => {
		window.close();
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
			<div className="flex flex-col items-center max-w-md">
				{isSuccess ? (
					<CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
				) : (
					<XCircle className="w-16 h-16 text-red-500 mb-4" />
				)}

				<h1 className="text-2xl font-bold mb-4">
					{isSuccess ? "GitHub Connection Complete" : "GitHub Connection Error"}
				</h1>

				{message && <p className="mb-6 text-gray-600">{message}</p>}

				<Button onClick={handleClose} className="mt-4">
					Close Window
				</Button>
			</div>
		</div>
	);
}
