"use client";

import clsx from "clsx/lite";

interface ResizeHandleProps {
	direction?: "horizontal" | "vertical";
	className?: string;
	onMouseDown?: (e: React.MouseEvent) => void;
	style?: React.CSSProperties;
}

export function ResizeHandle({
	direction = "vertical",
	className,
	onMouseDown,
	style,
}: ResizeHandleProps) {
	const isVertical = direction === "vertical";

	return (
		<button
			type="button"
			className={clsx(
				"transition-colors duration-200 flex items-center justify-center group",
				isVertical
					? "h-[12px] cursor-row-resize"
					: "w-[12px] cursor-col-resize",
				className,
			)}
			onMouseDown={onMouseDown}
			style={style}
		>
			<div
				className={clsx(
					"rounded-full bg-[#6b7280] opacity-60 group-hover:bg-[#4a90e2] group-hover:opacity-100",
					isVertical ? "h-[3px] w-[32px]" : "w-[3px] h-[32px]",
				)}
			/>
		</button>
	);
}
