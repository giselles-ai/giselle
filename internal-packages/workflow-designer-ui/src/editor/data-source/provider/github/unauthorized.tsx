import { useIntegration } from "@giselle-sdk/giselle-engine/react";
import { useCallback, useEffect, useTransition } from "react";
import { GitHubIcon, SpinnerIcon } from "../../../../icons";
import { usePopupWindow } from "../../../lib/use-popup-window";
import { COMMON_STYLES } from "../../../properties-panel/ui";

export function Unauthorized({ authUrl }: { authUrl: string }) {
	const { refresh } = useIntegration();
	const [isPending, startTransition] = useTransition();
	const { open } = usePopupWindow(authUrl);

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
		<div className={COMMON_STYLES.githubAuthContainer}>
			<div className="flex flex-col gap-[8px]">
				<p>To get started you have to sign into your GitHub account</p>
				<button
					type="button"
					className="group cursor-pointer bg-black-900 rounded-[4px] py-[4px] flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-wait"
					onClick={open}
					disabled={isPending}
				>
					<GitHubIcon className="size-[18px]" />
					Continue with GitHub
					<SpinnerIcon className="hidden group-disabled:block animate-follow-through-overlap-spin" />
				</button>
			</div>
		</div>
	);
}
