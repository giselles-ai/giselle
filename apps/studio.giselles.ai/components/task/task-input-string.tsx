"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export function TaskInputString({ value }: { value: string }) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [isCollapsedOverflowing, setIsCollapsedOverflowing] = useState(false);
	const [isExpandedOverflowing, setIsExpandedOverflowing] = useState(false);
	const [contentElement, setContentElement] = useState<HTMLDivElement | null>(
		null,
	);
	const contentRef = useCallback((node: HTMLDivElement | null) => {
		setContentElement(node);
	}, []);

	const measureOverflow = useCallback(() => {
		void value;
		void isExpanded;

		const element = contentElement;
		if (!element) {
			return;
		}

		const collapsedMaxHeightPx = 55;
		const computedStyle = window.getComputedStyle(element);
		const paddingTop = Number.parseFloat(computedStyle.paddingTop) || 0;
		const paddingBottom = Number.parseFloat(computedStyle.paddingBottom) || 0;

		const scrollHeightWithoutPadding =
			element.scrollHeight - paddingTop - paddingBottom;
		const nextIsCollapsedOverflowing =
			scrollHeightWithoutPadding > collapsedMaxHeightPx + 0.5;

		setIsCollapsedOverflowing(nextIsCollapsedOverflowing);

		const nextIsExpandedOverflowing =
			element.scrollHeight > element.clientHeight + 0.5 ||
			element.scrollWidth > element.clientWidth + 0.5;
		setIsExpandedOverflowing(nextIsExpandedOverflowing);

		if (!nextIsCollapsedOverflowing) {
			setIsExpanded(false);
		}
	}, [contentElement, isExpanded, value]);

	useLayoutEffect(() => {
		measureOverflow();
	}, [measureOverflow]);

	useEffect(() => {
		if (!contentElement) {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			measureOverflow();
		});

		resizeObserver.observe(contentElement);
		return () => {
			resizeObserver.disconnect();
		};
	}, [contentElement, measureOverflow]);

	const shouldShowGradient =
		(!isExpanded && isCollapsedOverflowing) ||
		(isExpanded && isExpandedOverflowing);

	if (!isCollapsedOverflowing) {
		return (
			<div
				className="w-full text-left whitespace-pre-wrap break-words"
				ref={contentRef}
			>
				{value}
			</div>
		);
	}

	return (
		<button
			aria-expanded={isExpanded}
			onClick={() => setIsExpanded((prev) => !prev)}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					setIsExpanded((prev) => !prev);
				}
			}}
			type="button"
			tabIndex={0}
			className="w-full cursor-pointer focus-visible:outline-none relative text-left"
		>
			<div
				ref={contentRef}
				className={[
					"whitespace-pre-wrap break-words",
					"transition-[max-height] duration-200 ease-out",
					isExpanded
						? [
								"max-h-[276px] overflow-auto",
								isExpandedOverflowing ? "pb-[40px]" : "",
							].join(" ")
						: "max-h-[55px] overflow-hidden",
				].join(" ")}
			>
				{value}
			</div>
			{/* #090e17 is an adhoc color to mimic the background color, should be the same color if the background is not transparent */}
			{shouldShowGradient ? (
				<div
					className="pointer-events-none absolute bottom-0 left-0 right-0 h-[27px] bg-gradient-to-t from-[#090e17] to-transparent"
					aria-hidden="true"
				/>
			) : null}
		</button>
	);
}
