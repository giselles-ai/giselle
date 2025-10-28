"use client";

import clsx from "clsx/lite";
import type { ReactNode } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";

interface ResizableSectionProps {
	children: ReactNode;
	title?: string;
	defaultSize?: number;
	minSize?: number;
	maxSize?: number;
	collapsible?: boolean;
	className?: string;
}

interface ResizableSectionGroupProps {
	children: ReactNode;
	direction?: "horizontal" | "vertical";
	className?: string;
}

interface ResizeHandleProps {
	direction?: "horizontal" | "vertical";
	className?: string;
	onMouseDown?: (e: React.MouseEvent) => void;
	style?: React.CSSProperties;
}

function ResizableSectionGroup({
	children,
	direction = "vertical",
	className,
}: ResizableSectionGroupProps) {
	return (
		<PanelGroup
			direction={direction}
			className={clsx("flex-1 flex", className)}
		>
			{children}
		</PanelGroup>
	);
}

function ResizableSection({
	children,
	title,
	defaultSize = 50,
	minSize = 20,
	maxSize,
	collapsible = false,
	className,
}: ResizableSectionProps) {
	return (
		<Panel
			defaultSize={defaultSize}
			minSize={minSize}
			maxSize={maxSize}
			collapsible={collapsible}
			className={className}
		>
			{title && (
				<div className="px-4 py-2 border-b border-border bg-surface-background/50">
					<h3 className="text-sm font-medium text-inverse">{title}</h3>
				</div>
			)}
			<div className="flex-1 overflow-hidden h-full">{children}</div>
		</Panel>
	);
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
