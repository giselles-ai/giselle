import clsx from "clsx/lite";
import type { ReactNode } from "react";

export function SettingRow({
	label,
	children,
	labelWidth = 120,
	gap = 12,
	className,
}: {
	label: ReactNode;
	children: ReactNode;
	labelWidth?: number; // px
	gap?: number; // px
	className?: string;
}) {
	return (
		<div
			className={clsx(
				"flex w-full items-center justify-between",
				`gap-[${gap}px]`,
				className,
			)}
		>
			<div className={clsx("shrink-0", `w-[${labelWidth}px]`)}>{label}</div>
			<div className="grow min-w-0">{children}</div>
		</div>
	);
}
