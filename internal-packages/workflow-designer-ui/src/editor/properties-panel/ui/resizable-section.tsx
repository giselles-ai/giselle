"use client";

import clsx from "clsx/lite";
import type { ReactNode } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

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

interface ResizableSectionHandleProps {
	direction?: "horizontal" | "vertical";
	className?: string;
}

interface ResizeHandleProps {
	direction?: "horizontal" | "vertical";
	className?: string;
	onMouseDown?: (e: React.MouseEvent) => void;
	style?: React.CSSProperties;
}

export function ResizableSectionGroup({
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

export function ResizableSection({
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
					<h3 className="text-sm font-medium text-white-900">{title}</h3>
				</div>
			)}
			<div className="flex-1 overflow-hidden">{children}</div>
		</Panel>
	);
}

export function ResizableSectionHandle({
	direction = "vertical",
	className,
}: ResizableSectionHandleProps) {
	const isVertical = direction === "vertical";

	return (
		<PanelResizeHandle
			className={clsx(
				"transition-colors duration-100 ease-in-out",
				isVertical
					? [
							"h-[3px] bg-border cursor-row-resize",
							"data-[resize-handle-state=hover]:bg-[#4a90e2]",
							"data-[resize-handle-state=drag]:bg-[#4a90e2]",
						]
					: [
							"w-[3px] bg-border cursor-col-resize",
							"data-[resize-handle-state=hover]:bg-[#4a90e2]",
							"data-[resize-handle-state=drag]:bg-[#4a90e2]",
						],
				className,
			)}
		/>
	);
}

export function ResizableSectionHandleWithIcon({
	direction = "vertical",
	className,
}: ResizableSectionHandleProps) {
	return (
		<PanelResizeHandle
			className={clsx("flex items-center justify-center", className)}
		>
			<ResizeHandle direction={direction} />
		</PanelResizeHandle>
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
		<div
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
		</div>
	);
}
