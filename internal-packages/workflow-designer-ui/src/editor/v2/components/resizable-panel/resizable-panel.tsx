"use client";

import clsx from "clsx/lite";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

interface ResizablePanelProps {
	children: ReactNode;
	isOpen: boolean;
	minWidth: number;
	maxWidth: number;
	defaultWidth: number;
	className?: string;
	onWidthChange?: (width: number) => void;
}

export function ResizablePanel({
	children,
	isOpen,
	minWidth,
	maxWidth,
	defaultWidth,
	className,
	onWidthChange,
}: ResizablePanelProps) {
	const [width, setWidth] = useState(defaultWidth);
	const [isResizing, setIsResizing] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);

	// Update width when panel opens/closes
	useEffect(() => {
		if (isOpen && width < minWidth) {
			setWidth(defaultWidth);
		}
	}, [isOpen, width, minWidth, defaultWidth]);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsResizing(true);

			const startX = e.clientX;
			const startWidth = width;

			const handleMouseMove = (e: MouseEvent) => {
				const deltaX = e.clientX - startX;
				const newWidth = Math.max(
					minWidth,
					Math.min(maxWidth, startWidth + deltaX),
				);
				setWidth(newWidth);
				onWidthChange?.(newWidth);
			};

			const handleMouseUp = () => {
				setIsResizing(false);
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};

			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[width, minWidth, maxWidth, onWidthChange],
	);

	if (!isOpen) {
		return null;
	}

	return (
		<div
			ref={panelRef}
			className={clsx(
				"relative bg-black-900 border-r border-white/10 flex-shrink-0",
				"transition-all duration-200 ease-out",
				"mt-[0.2px] mb-[0.2px] h-[calc(100%-0.4px)]",
				isResizing && "select-none",
				className,
			)}
			style={{ width: `${width}px` }}
		>
			{/* Panel content */}
			<div className="h-full overflow-hidden">{children}</div>

			{/* Resize handle */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: resize handle requires mouse interaction */}
			<div
				className={clsx(
					"absolute top-0 right-0 w-[12px] h-full cursor-col-resize",
					"transition-colors duration-200 flex items-center justify-center group",
				)}
				onMouseDown={handleMouseDown}
			>
				<div
					className={clsx(
						"w-[3px] h-[32px] rounded-full",
						"bg-[#6b7280] opacity-60",
						"group-hover:bg-[#4a90e2] group-hover:opacity-100",
					)}
				/>
			</div>
		</div>
	);
}
