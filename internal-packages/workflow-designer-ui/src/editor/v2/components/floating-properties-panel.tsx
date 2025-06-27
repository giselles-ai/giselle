"use client";

import clsx from "clsx/lite";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { ResizeHandle } from "../../properties-panel/ui/resizable-section";

interface FloatingPropertiesPanelProps {
	isOpen: boolean;
	children: ReactNode;
	className?: string;
	defaultWidth?: number;
	minWidth?: number;
	maxWidth?: number;
	position?: "right" | "left";
}

export function FloatingPropertiesPanel({
	isOpen,
	children,
	className,
	defaultWidth = 400,
	minWidth = 300,
	maxWidth = 800,
	position = "right",
}: FloatingPropertiesPanelProps) {
	const [width, setWidth] = useState(defaultWidth);
	const [isResizing, setIsResizing] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);
	const intermediateWidthRef = useRef(defaultWidth);

	// Throttle utility for mousemove events
	const throttle = useCallback(
		(func: (e: MouseEvent) => void, delay: number) => {
			let timeoutId: NodeJS.Timeout | null = null;
			let lastExecTime = 0;
			return (e: MouseEvent) => {
				const currentTime = Date.now();
				if (currentTime - lastExecTime > delay) {
					func(e);
					lastExecTime = currentTime;
				} else {
					if (timeoutId) clearTimeout(timeoutId);
					timeoutId = setTimeout(
						() => {
							func(e);
							lastExecTime = Date.now();
						},
						delay - (currentTime - lastExecTime),
					);
				}
			};
		},
		[],
	);

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			console.log("Resize handle mousedown triggered", {
				clientX: e.clientX,
				width,
			});
			e.preventDefault();
			e.stopPropagation();
			setIsResizing(true);

			const startX = e.clientX;
			const startWidth = width;
			intermediateWidthRef.current = startWidth;

			const handleMouseMove = (e: MouseEvent) => {
				const deltaX =
					position === "right" ? startX - e.clientX : e.clientX - startX;
				const newWidth = Math.max(
					minWidth,
					Math.min(maxWidth, startWidth + deltaX),
				);
				intermediateWidthRef.current = newWidth;
				setWidth(newWidth);
			};

			const throttledMouseMove = throttle(handleMouseMove, 16); // ~60fps throttling

			const handleMouseUp = () => {
				console.log("Resize handle mouseup triggered");
				setIsResizing(false);
				document.removeEventListener("mousemove", throttledMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};

			document.addEventListener("mousemove", throttledMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[width, minWidth, maxWidth, throttle, position],
	);

	if (!isOpen) return null;

	return (
		<div
			className={clsx(
				"absolute top-4 bottom-4 z-10 pointer-events-none",
				position === "right" ? "right-4" : "left-4",
			)}
			style={{ width: `${width}px` }}
		>
			<div
				ref={panelRef}
				className={clsx(
					"h-full pointer-events-auto relative rounded-[12px] shadow-xl",
					isOpen
						? "translate-x-0 opacity-100"
						: position === "right"
							? "translate-x-full opacity-0"
							: "-translate-x-full opacity-0",
					!isResizing && "transform transition-all duration-300 ease-out",
					className,
				)}
			>
				{/* Glass effect background with backdrop blur */}
				<div
					className="absolute inset-0 -z-10 rounded-[12px] backdrop-blur-md"
					style={{
						background:
							"linear-gradient(135deg, rgba(150, 150, 150, 0.03) 0%, rgba(60, 90, 160, 0.12) 100%)",
					}}
				/>

				{/* Top gradient line */}
				<div className="absolute -z-10 top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

				{/* Border */}
				<div className="absolute -z-10 inset-0 rounded-[12px] border border-white/10" />

				{/* Resize handle */}
				<ResizeHandle
					direction="horizontal"
					className={clsx(
						"absolute top-0 bottom-0 z-20",
						position === "right" ? "left-0" : "right-0",
					)}
					onMouseDown={handleMouseDown}
					style={{ pointerEvents: "auto" }}
				/>

				{/* Content */}
				<div
					className={clsx(
						"h-full overflow-hidden relative z-10 px-2 pb-2",
						position === "right" ? "pl-3" : "pr-3",
					)}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
