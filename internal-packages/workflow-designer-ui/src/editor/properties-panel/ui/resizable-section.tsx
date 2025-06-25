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
							"h-[1px] bg-border cursor-row-resize",
							"data-[resize-handle-state=hover]:bg-[#4a90e2]",
							"data-[resize-handle-state=drag]:bg-[#4a90e2]",
						]
					: [
							"w-[1px] bg-border cursor-col-resize",
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
	const isVertical = direction === "vertical";

	return (
		<PanelResizeHandle
			className={clsx(
				"transition-colors duration-100 ease-in-out flex items-center justify-center",
				isVertical
					? [
							"h-[12px] cursor-row-resize",
							"after:content-[''] after:h-[3px] after:w-[32px] after:bg-[#6b7280] after:rounded-full",
							"hover:after:bg-[#4a90e2]",
						]
					: [
							"w-[12px] cursor-col-resize",
							"after:content-[''] after:w-[3px] after:h-[32px] after:bg-[#6b7280] after:rounded-full",
							"hover:after:bg-[#4a90e2]",
						],
				className,
			)}
		/>
	);
}
