"use client";

import { Button } from "@/components/ui/button";
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
			variant="link"
			onClick={handleInstall}
			className="flex items-center gap-2 w-full justify-center px-6 py-3 text-sm font-medium flex-shrink text-black-30"
		>
			{installed
				? "Configure Giselle's GitHub App"
				: "Add Giselle's GitHub App"}
			<ExternalLink className="w-5 h-5" />
		</Button>
	);
}
