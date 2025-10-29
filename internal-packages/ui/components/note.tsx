import clsx from "clsx/lite";
import { AlertCircle } from "lucide-react";
import type React from "react";

interface NoteProps {
	children: React.ReactNode;
	type?: "error" | "warning" | "success" | "info";
	action?: React.ReactNode;
	showIcon?: boolean;
}

export function Note({
	children,
	type = "error",
	action,
	showIcon = true,
}: NoteProps) {
	const containerClass =
		type === "error"
			? "rounded-[8px] border border-error-900/40 bg-error-900/10 px-[12px] py-[8px] flex items-start gap-[8px]"
			: type === "warning"
				? "rounded-[8px] border border-yellow-500/40 bg-yellow-500/10 px-[12px] py-[8px] flex items-start gap-[8px]"
				: type === "info"
					? "rounded-[8px] border border-blue-500/40 bg-blue-500/10 px-[12px] py-[8px] flex items-start gap-[8px]"
					: "rounded-[8px] border border-green-500/40 bg-green-500/10 px-[12px] py-[8px] flex items-start gap-[8px]";

	const iconClass =
		type === "error"
			? "text-error-200"
			: type === "warning"
				? "text-yellow-200"
				: type === "info"
					? "text-blue-200"
					: "text-green-200";

	const textClass =
		type === "error"
			? "text-error-100"
			: type === "warning"
				? "text-yellow-100"
				: type === "info"
					? "text-blue-100"
					: "text-green-100";

	return (
		<div className={clsx(containerClass)} data-type={type}>
			{showIcon && (
				<AlertCircle className={clsx("size-[16px] mt-[2px]", iconClass)} />
			)}
			<div className={clsx("flex-1 text-[12px]", textClass)}>{children}</div>
			{action && <div className="flex-shrink-0">{action}</div>}
		</div>
	);
}
