"use client";

import { Button } from "@giselle-internal/ui/button";
import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

type Props = {
	installationUrl: string;
	installed: boolean;
};

export function GitHubAppInstallButton({ installationUrl, installed }: Props) {
	const popupRef = useRef<Window | null>(null);
	const intervalRef = useRef<number | null>(null);
	const router = useRouter();

	const handleInstall = () => {
		const width = 800;
		const height = 800;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;

		popupRef.current = window.open(
			installationUrl,
			"Configure GitHub App",
			`width=${width},height=${height},top=${top},left=${left},popup=1`,
		);

		if (!popupRef.current) {
			console.warn("Failed to open popup window");
			return;
		}

		intervalRef.current = window.setInterval(() => {
			if (popupRef.current?.closed) {
				router.refresh();
				if (intervalRef.current) {
					window.clearInterval(intervalRef.current);
				}
			}
		}, 300);
	};

	useEffect(() => {
		const handleFocus = () => {
			if (popupRef.current?.closed) {
				router.refresh();
				if (intervalRef.current) {
					window.clearInterval(intervalRef.current);
				}
			}
		};

		window.addEventListener("focus", handleFocus);

		return () => {
			window.removeEventListener("focus", handleFocus);
			if (intervalRef.current) {
				window.clearInterval(intervalRef.current);
			}
			if (popupRef.current && !popupRef.current.closed) {
				popupRef.current.close();
			}
		};
	}, [router]);

	return (
		<Button
			onClick={handleInstall}
			variant="primary"
			size="large"
			rightIcon={<ExternalLink />}
		>
			{installed
				? "Configure Giselle's GitHub App"
				: "Add Giselle's GitHub App"}
		</Button>
	);
}
