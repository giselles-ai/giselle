"use client";

import { GlassSurfaceLayers } from "@giselle-internal/ui/glass-surface";
import clsx from "clsx/lite";
import { Dialog } from "radix-ui";
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
	container?: React.ComponentProps<typeof Dialog.Portal>["container"];
	title: string;
	onClose?: () => void;
	autoHeight?: boolean;
}

export function FloatingPropertiesPanel({
	isOpen,
	children,
	className,
	defaultWidth = 480,
	minWidth = 480,
	maxWidth = 1200,
	position = "right",
	container,
	title,
	onClose,
	autoHeight = false,
}: FloatingPropertiesPanelProps) {
	const [width, setWidth] = useState(defaultWidth);
	const [isResizing, setIsResizing] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);
	const intermediateWidthRef = useRef(defaultWidth);

	// Throttle utility for mousemove events
	const throttle = useCallback(
		(func: (e: MouseEvent) => void, delay: number) => {
			let timeoutId: ReturnType<typeof setTimeout> | null = null;
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
			// Resize handle mousedown
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
				// Resize handle mouseup
				setIsResizing(false);
				document.removeEventListener("mousemove", throttledMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};

			document.addEventListener("mousemove", throttledMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		},
		[width, minWidth, maxWidth, throttle, position],
	);

	return (
		<Dialog.Root open={isOpen} modal={false}>
			<Dialog.Portal container={container}>
				<Dialog.Content asChild onPointerDownOutside={onClose}>
					<div
						className={clsx(
							autoHeight
								? "absolute top-4 z-10 pointer-events-none"
								: "absolute top-4 bottom-4 z-10 pointer-events-none",
							position === "right" ? "right-4" : "left-4",
						)}
						style={{
							width: `${width}px`,
							...(autoHeight ? { maxHeight: "calc(100vh - 32px)" } : {}),
						}}
					>
						<Dialog.Title className="sr-only">{title}</Dialog.Title>
						<div
							ref={panelRef}
							className={clsx(
								autoHeight
									? "pointer-events-auto relative rounded-[12px] shadow-xl h-auto"
									: "h-full pointer-events-auto relative rounded-[12px] shadow-xl",
								isOpen
									? "translate-x-0 opacity-100"
									: position === "right"
										? "translate-x-full opacity-0"
										: "-translate-x-full opacity-0",
								!isResizing && "transform transition-all duration-300 ease-out",
								className,
							)}
						>
							{/* Base fill (front) */}
							<div
								className="absolute inset-0 -z-10 rounded-[12px] pointer-events-none"
								style={{
									backgroundColor:
										"color-mix(in srgb, var(--color-background, #00020b) 50%, transparent)",
								}}
							/>
							<GlassSurfaceLayers
								tone="default"
								borderStyle="solid"
								withBaseFill={false}
								blurClass="backdrop-blur-md"
								zIndexClass="z-0"
							/>

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
									autoHeight
										? "overflow-hidden relative z-10 pt-2 pb-3 px-3 h-auto"
										: "h-full overflow-hidden relative z-10 pt-2 pb-3 px-3",
								)}
								style={
									autoHeight ? { maxHeight: "calc(100vh - 32px)" } : undefined
								}
							>
								{children}
							</div>
						</div>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
