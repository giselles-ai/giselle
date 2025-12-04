import clsx from "clsx/lite";
import { AlertCircle } from "lucide-react";
import type React from "react";

interface NoteProps {
	children: React.ReactNode;
	type?: "error" | "warning" | "success" | "info";
	action?: React.ReactNode;
	showIcon?: boolean;
}

const typeStyles = {
	error: {
		container:
			"rounded-[8px] border border-error-900/40 bg-error-900/10 px-[12px] py-[8px] flex items-start gap-[8px]",
		icon: "text-error-200",
		text: "text-error-100",
	},
	warning: {
		container:
			"rounded-[8px] border border-yellow-500/40 bg-yellow-500/10 px-[12px] py-[8px] flex items-start gap-[8px]",
		icon: "text-yellow-200",
		text: "text-yellow-100",
	},
	info: {
		container:
			"rounded-[8px] border border-blue-500/40 bg-blue-500/10 px-[12px] py-[8px] flex items-start gap-[8px]",
		icon: "text-blue-200",
		text: "text-blue-100",
	},
	success: {
		container:
			"rounded-[8px] border border-green-500/40 bg-green-500/10 px-[12px] py-[8px] flex items-start gap-[8px]",
		icon: "text-green-200",
		text: "text-green-100",
	},
} as const satisfies Record<
	NoteProps["type"] & string,
	{ container: string; icon: string; text: string }
>;

export function Note({
	children,
	type = "error",
	action,
	showIcon = true,
}: NoteProps) {
	const styles = typeStyles[type];

	return (
		<div className={clsx(styles.container)} data-type={type}>
			{showIcon && (
				<AlertCircle className={clsx("size-[16px] mt-[2px]", styles.icon)} />
			)}
			<div className={clsx("flex-1 text-[12px]", styles.text)}>{children}</div>
			{action && <div className="flex-shrink-0">{action}</div>}
		</div>
	);
}
