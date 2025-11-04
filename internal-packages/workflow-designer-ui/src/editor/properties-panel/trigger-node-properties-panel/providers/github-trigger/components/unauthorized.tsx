import { useIntegration } from "@giselles-ai/giselle/react";
import { useCallback, useEffect, useTransition } from "react";
import { SourceLinkIcon, SpinnerIcon } from "../../../../../../icons";
import { usePopupWindow } from "../../../hooks/use-popup-window";

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
		<div className="bg-bg-900/10 h-full rounded-[8px] flex items-center justify-center">
			<div className="flex flex-col items-center text-center gap-[16px]">
				<div className="flex flex-col items-center gap-[8px]">
					<SourceLinkIcon className="fill-text/60 size-[24px]" />
					<p className="font-[800] text-text/60 text-[16px]">
						Sign in to your GitHub account to get started
					</p>
					<p className="text-text-muted text-[12px] text-center leading-5">
						Connect your account to enable GitHub triggers
					</p>
				</div>
				<button
					type="button"
					className="flex items-center justify-center px-[24px] py-[12px] mt-[16px] bg-background text-white rounded-[9999px] border border-border/15 transition-all hover:bg-[color-mix(in srgb,var(--color-text-inverse, #fff) 5%,transparent)] hover:border-border/25 hover:translate-y-[-1px] cursor-pointer font-sans font-[500] text-[14px] disabled:opacity-50 disabled:cursor-wait group"
					onClick={open}
					disabled={isPending}
				>
					Continue with GitHub
					<SpinnerIcon className="hidden group-disabled:block animate-follow-through-overlap-spin ml-[8px]" />
				</button>
			</div>
		</div>
	);
}
