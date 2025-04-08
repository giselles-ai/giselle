"use client";

import { Button } from "@/components/ui/button";
import type { InstallationWithRepositories } from "@/services/external/github/team-installation";
import { GitHubIcon } from "@giselles-ai/icons/github";
import { ExternalLinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

interface GitHubIntegrationProps {
	teamId: string;
	installationUrl: string;
	installations: InstallationWithRepositories[];
}

export default function GitHubIntegration({
	teamId,
	installationUrl,
	installations = [],
}: GitHubIntegrationProps) {
	const router = useRouter();
	const popupRef = useRef<Window | null>(null);

	// Handler for installation message from popup window
	const handleInstallationMessage = useCallback(
		(event: MessageEvent) => {
			if (event.data?.type === "github-app-installed") {
				router.refresh();
			}
		},
		[router],
	);

	// Listen for visibility changes to refresh data when user returns to the page
	useEffect(() => {
		// Add event listener for installation message from popup
		window.addEventListener("message", handleInstallationMessage);

		return () => {
			window.removeEventListener("message", handleInstallationMessage);

			// Close popup if component unmounts
			if (popupRef.current && !popupRef.current.closed) {
				popupRef.current.close();
			}
		};
	}, [handleInstallationMessage]);

	// Open installation window
	const handleInstall = () => {
		const width = 1000;
		const height = 800;
		const left = window.screenX + (window.outerWidth - width) / 2;
		const top = window.screenY + (window.outerHeight - height) / 2;

		// Add team ID as state parameter
		const installUrlWithTeam = `${installationUrl}${installationUrl.includes("?") ? "&" : "?"}state=${encodeURIComponent(teamId)}`;

		popupRef.current = window.open(
			installUrlWithTeam,
			"Configure GitHub App",
			`width=${width},height=${height},top=${top},left=${left},popup=1`,
		);

		if (!popupRef.current) {
			alert(
				"Failed to open popup window. Please check your popup blocker settings.",
			);
		}
	};

	const hasInstallations = installations.length > 0;

	return (
		<div className="space-y-8 text-black-30">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<GitHubIcon className="size-[34px]" />
					<div>
						<h2 className="text-lg">GitHub</h2>
						<div className="text-sm text-muted-foreground">
							{hasInstallations
								? "Connected to GitHub"
								: "Connect GitHub repositories to your team"}
						</div>
					</div>
				</div>

				<Button
					variant="link"
					onClick={handleInstall}
					className="flex items-center gap-2 w-auto justify-center px-6 py-3 text-sm font-medium shrink text-black-30 cursor-pointer"
				>
					{hasInstallations ? "Configure GitHub App" : "Install GitHub App"}
					<ExternalLinkIcon className="size-[18px]" />
				</Button>
			</div>

			{hasInstallations && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{installations.map((installation) => (
						<InstallationCard
							key={installation.id}
							installation={installation}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// Installation card component
function InstallationCard({
	installation,
}: { installation: InstallationWithRepositories }) {
	const account = installation.account;
	if (!account) {
		return null;
	}

	const displayName =
		"login" in account ? account.login : account.name || "Unknown";
	const avatarUrl = "avatar_url" in account ? account.avatar_url : undefined;

	return (
		<div className="overflow-hidden rounded-lg border border-black-70">
			<div className="flex items-center space-x-3 border-b border-black-70 p-3 bg-black-70">
				{avatarUrl && (
					<img
						src={avatarUrl}
						alt={displayName}
						className="w-6 h-6 rounded-full"
					/>
				)}
				<span>{displayName}</span>
			</div>

			<div className="p-4">
				{installation.repositories.length === 0 ? (
					<p className="text-sm text-gray-500">No repositories available</p>
				) : (
					<div className="space-y-3">
						{installation.repositories.map((repo) => (
							<div key={repo.id} className="flex items-center">
								<a
									href={repo.html_url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm hover:underline"
								>
									{repo.name}
								</a>
								<span className="ml-2 rounded-full px-2 py-0.5 text-xs border border-black-30">
									{repo.private ? "Private" : "Public"}
								</span>
							</div>
						))}

						{installation.repositories.length > 10 && (
							<p className="text-sm text-gray-500">
								Showing 10 of {installation.repositories.length} repositories
							</p>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
