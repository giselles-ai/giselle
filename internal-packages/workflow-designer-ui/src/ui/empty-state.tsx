import clsx from "clsx/lite";
import type { ReactNode } from "react";

export function EmptyState({
	title,
	icon,
	description,
	children,
	className,
}: {
	title: string;
	icon?: ReactNode;
	description?: string;
	className?: string;
	children?: ReactNode;
}) {
	return (
		<div className={clsx("flex flex-col items-center gap-[8px]", className)}>
			{icon}
			<p className="font-[800] text-text/60">{title}</p>
			{description && (
				<p className="text-text-muted text-[12px] text-center leading-5">
					{description}
				</p>
			)}
			{children}
		</div>
	);
}
