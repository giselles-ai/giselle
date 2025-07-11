import { useIntegration } from "@giselle-sdk/giselle-engine/react";
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
		<div className="bg-white-900/10 h-full rounded-[8px] flex items-center justify-center">
			<div className="flex flex-col items-center text-center gap-[16px]">
				<div className="flex flex-col items-center gap-[8px]">
					<SourceLinkIcon className="fill-black-300 size-[24px]" />
					<p className="font-[800] text-black-300 text-[16px]">
						Install GitHub Application
					</p>
					<p className="text-black-400 text-[12px] text-center leading-5">
						Install the GitHub application for the accounts you wish to import
						from to continue
					</p>
				</div>
				<button
					type="button"
					className="flex items-center justify-center px-[24px] py-[12px] mt-[16px] bg-[#141519] text-white rounded-[9999px] border border-white-900/15 transition-all hover:bg-[#1e1f26] hover:border-white-900/25 hover:translate-y-[-1px] cursor-pointer font-sans font-[500] text-[14px] disabled:opacity-50 disabled:cursor-wait group"
					onClick={open}
					disabled={isPending}
				>
					Install
					<SpinnerIcon className="hidden group-disabled:block animate-follow-through-overlap-spin ml-[8px]" />
				</button>
			</div>
		</div>
	);
}
