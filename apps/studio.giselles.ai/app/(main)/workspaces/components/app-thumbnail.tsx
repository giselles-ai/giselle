import { AppIcon } from "@giselle-internal/ui/app-icon";
import clsx from "clsx/lite";

export function AppThumbnail({
	className,
	children,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<div
			className={clsx(
				"aspect-video w-full rounded-lg flex items-center justify-center border border-border-muted",
				// use muted surface tint instead of white-ish overlay to avoid bright stroke
				"bg-[color-mix(in_srgb,var(--color-surface-background,_#2f343e)_20%,transparent)]",
				className,
			)}
		>
			{children ?? <AppIcon />}
		</div>
	);
}
