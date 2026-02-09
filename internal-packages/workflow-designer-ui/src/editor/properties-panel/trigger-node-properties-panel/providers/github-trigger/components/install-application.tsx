import { Button } from "@giselle-internal/ui/button";
import { useIntegration } from "@giselles-ai/react";
import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useTransition } from "react";
import { SourceLinkIcon, SpinnerIcon } from "../../../../../../icons";
import { usePopupWindow } from "../../../hooks/use-popup-window";

export function InstallGitHubApplication({
	installationUrl,
}: {
	installationUrl: string;
}) {
	const [isPending, startTransition] = useTransition();
	const { refresh } = useIntegration();
	const { open } = usePopupWindow(installationUrl);

	const handleInstallationMessage = useCallback(
		(event: MessageEvent) => {
			if (event.data?.type === "github-app-installed") {
				startTransition(() => {
					refresh();
				});
			}
		},
		[refresh],
	);

	useEffect(() => {
		window.addEventListener("message", handleInstallationMessage);
		return () => {
			window.removeEventListener("message", handleInstallationMessage);
		};
	}, [handleInstallationMessage]);

	return (
		<div className="bg-bg-900/10 h-full rounded-[8px] flex items-center justify-center">
			<div className="flex flex-col items-center text-center gap-[16px]">
				<div className="flex flex-col items-center gap-[8px]">
					<SourceLinkIcon className="fill-text/60 size-[24px]" />
					<p className="font-[800] text-text/60 text-[16px]">
						Install GitHub Application
					</p>
					<p className="text-text-muted text-[12px] text-center leading-5">
						Install the GitHub application for the accounts you wish to import
						from to continue
					</p>
				</div>
				<Button
					type="button"
					variant="primary"
					size="large"
					onClick={open}
					disabled={isPending}
					rightIcon={
						isPending ? (
							<SpinnerIcon className="animate-follow-through-overlap-spin" />
						) : (
							<ExternalLink />
						)
					}
				>
					Install
				</Button>
			</div>
		</div>
	);
}
