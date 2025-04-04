"use client";

import { Button } from "@/components/v2/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type GitHubAuthenticationPopupButtonProps = {
	href: string;
	label: string;
	className?: string;
	next?: string;
};

export function GitHubAuthenticationPopupButton({
	href,
	label,
	className,
	next,
}: GitHubAuthenticationPopupButtonProps) {
	const popupRef = useRef<Window | null>(null);
	const intervalRef = useRef<number | null>(null);
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const handleAuth = () => {
		const width = 400;
		const height = 600;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;

		// Set loading state
		setIsLoading(true);

		// Add next parameter to URL if provided
		const url = next ? `${href}?next=${encodeURIComponent(next)}` : href;

		popupRef.current = window.open(
			url,
			"GitHub Authentication",
			`width=${width},height=${height},top=${top},left=${left},popup=1`,
		);

		if (!popupRef.current) {
			console.warn("Failed to open popup window");
			setIsLoading(false);
			return;
		}

		intervalRef.current = window.setInterval(() => {
			if (popupRef.current?.closed) {
				router.refresh();
				setIsLoading(false);
				if (intervalRef.current) {
					window.clearInterval(intervalRef.current);
				}
			}
		}, 300);
	};

	useEffect(() => {
		// Handle window focus (detect if popup was closed)
		const handleFocus = () => {
			if (popupRef.current?.closed) {
				router.refresh();
				setIsLoading(false);
				if (intervalRef.current) {
					window.clearInterval(intervalRef.current);
				}
			}
		};

		// Handle message from popup window
		const handleMessage = (event: MessageEvent) => {
			if (event.data && event.data.type === "GITHUB_AUTH_COMPLETE") {
				// Refresh the component without full page reload
				router.refresh();

				// Reset loading state
				setIsLoading(false);

				// Close the popup once we've received the message
				if (popupRef.current && !popupRef.current.closed) {
					popupRef.current.close();
				}

				// Clear the interval
				if (intervalRef.current) {
					window.clearInterval(intervalRef.current);
				}
			}
		};

		window.addEventListener("focus", handleFocus);
		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("focus", handleFocus);
			window.removeEventListener("message", handleMessage);
			if (intervalRef.current) {
				window.clearInterval(intervalRef.current);
			}
			if (popupRef.current && !popupRef.current.closed) {
				popupRef.current.close();
			}
			// Reset loading state on unmount if still loading
			setIsLoading(false);
		};
	}, [router]);

	return (
		<Button onClick={handleAuth} className={className} disabled={isLoading}>
			{isLoading ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Connecting...
				</>
			) : (
				<>
					{label}
					<ExternalLink className="shrink-0 w-5 h-5 ml-2" />
				</>
			)}
		</Button>
	);
}
