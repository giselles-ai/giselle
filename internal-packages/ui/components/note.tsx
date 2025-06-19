import clsx from "clsx/lite";
import { AlertCircle } from "lucide-react";
import type React from "react";

interface NoteProps {
	children: React.ReactNode;
	type?: "error" | "warning" | "success" | "info";
	fill?: boolean;
	action?: React.ReactNode;
}

export function Note({
	children,
	type = "error",
	fill = false,
	action,
}: NoteProps) {
	return (
		<div
			className={clsx(
				"group flex items-center border px-[8px] py-[2px] rounded-[2px] border-border",
				// "data-[type=error]:text-error data-[type=error]:bg-error-background data-[type=error]:border-error-border",
			)}
			data-type={type}
		>
			<div className="flex items-center gap-[4px]">
				<AlertCircle className="size-[13px] flex-shrink-0 group-data-[type=error]:text-error" />
				<div className="flex-1 text-[13px]">{children}</div>
			</div>
			{action && <div className="flex-shrink-0">{action}</div>}
		</div>
	);
}
