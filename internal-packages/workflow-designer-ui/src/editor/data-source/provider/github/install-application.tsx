import { useIntegration } from "@giselle-sdk/integration/react";
import { useCallback, useEffect, useTransition } from "react";
import { GitHubIcon, SpinnerIcon } from "../../../../icons";
import { usePopupWindow } from "../../../lib/use-popup-window";

export function InstallGitHubApplication({
	installationUrl,
}: { installationUrl: string }) {
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
		<div className="bg-white-900/10 h-[300px] rounded-[8px] flex items-center justify-center">
			<div className="flex flex-col gap-[8px]">
				<p>
					Install the GitHub application for the accounts you with to Import
					from to continue
				</p>
				<button
					type="button"
					className="group cursor-pointer bg-black-900 rounded-[4px] py-[4px] flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-wait"
					onClick={open}
					disabled={isPending}
				>
					<GitHubIcon className="size-[18px]" />
					Install
					<SpinnerIcon className="hidden group-disabled:block animate-follow-through-overlap-spin" />
				</button>
			</div>
		</div>
	);
}
