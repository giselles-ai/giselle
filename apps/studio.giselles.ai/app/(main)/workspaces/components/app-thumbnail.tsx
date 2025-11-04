import { AppIcon } from "@giselle-internal/ui/app-icon";
import clsx from "clsx/lite";

export function AppThumbnail({
	className,
	children,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<div
			className={clsx(
				"aspect-video w-full rounded-lg flex items-center justify-center",
				className,
			)}
			style={{
				backgroundColor:
					"color-mix(in srgb, var(--color-text-inverse, #fff) 5%, transparent)",
			}}
		>
			{children ?? <AppIcon />}
		</div>
	);
}
