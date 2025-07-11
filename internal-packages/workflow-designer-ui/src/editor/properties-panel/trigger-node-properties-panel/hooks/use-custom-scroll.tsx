import { useCallback, useEffect, useRef, useState } from "react";

interface UseCustomScrollOptions {
	/**
	 * Amount to scroll when using arrow keys (in pixels)
	 */
	scrollStep?: number;
	/**
	 * Amount to scroll when using page up/down (in pixels)
	 */
	scrollPageStep?: number;
	/**
	 * Enable keyboard navigation
	 */
	enableKeyboardNavigation?: boolean;
	/**
	 * Initial scroll position
	 */
	initialScrollTop?: number;
	/**
	 * Callback when scroll position changes
	 */
	onScroll?: (scrollTop: number) => void;
}

interface UseCustomScrollResult {
	/**
	 * Ref to be attached to the scrollable element
	 */
	scrollRef: React.RefObject<HTMLDivElement | null>;
	/**
	 * Current scroll position
	 */
	scrollTop: number;
	/**
	 * Scroll to a specific position
	 */
	scrollTo: (position: number) => void;
	/**
	 * Scroll to the top of the element
	 */
	scrollToTop: () => void;
	/**
	 * Scroll to the bottom of the element
	 */
	scrollToBottom: () => void;
	/**
	 * ARIA attributes for accessibility
	 */
	ariaAttributes: {
		role: string;
		tabIndex: number;
		"aria-label": string;
	};
}

/**
 * Custom hook for enhanced scrolling functionality
 *
 * Features:
 * - Keyboard navigation (arrow keys, page up/down)
 * - Scroll position tracking
 * - Programmatic scrolling
 * - Accessibility support
 */
export function useCustomScroll({
	scrollStep = 40,
	scrollPageStep = 200,
	enableKeyboardNavigation = true,
	initialScrollTop = 0,
	onScroll,
}: UseCustomScrollOptions = {}): UseCustomScrollResult {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = useState<number>(initialScrollTop);

	// Handle scroll events
	const handleScroll = useCallback(() => {
		if (scrollRef.current) {
			const newScrollTop = scrollRef.current.scrollTop;
			setScrollTop(newScrollTop);
			onScroll?.(newScrollTop);
		}
	}, [onScroll]);

	// Keyboard navigation
	useEffect(() => {
		if (!enableKeyboardNavigation || !scrollRef.current) return;

		const element = scrollRef.current;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (!element) return;

			// Only handle events when the scrollable area is focused
			if (document.activeElement !== element) return;

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					element.scrollTop += scrollStep;
					break;
				case "ArrowUp":
					e.preventDefault();
					element.scrollTop -= scrollStep;
					break;
				case "PageDown":
					e.preventDefault();
					element.scrollTop += scrollPageStep;
					break;
				case "PageUp":
					e.preventDefault();
					element.scrollTop -= scrollPageStep;
					break;
				case "Home":
					e.preventDefault();
					element.scrollTop = 0;
					break;
				case "End":
					e.preventDefault();
					element.scrollTop = element.scrollHeight;
					break;
				default:
					return;
			}
		};

		element.addEventListener("keydown", handleKeyDown);
		element.addEventListener("scroll", handleScroll);

		return () => {
			element.removeEventListener("keydown", handleKeyDown);
			element.removeEventListener("scroll", handleScroll);
		};
	}, [enableKeyboardNavigation, scrollStep, scrollPageStep, handleScroll]);

	// Programmatic scrolling functions
	const scrollTo = useCallback((position: number) => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = position;
		}
	}, []);

	const scrollToTop = useCallback(() => {
		scrollTo(0);
	}, [scrollTo]);

	const scrollToBottom = useCallback(() => {
		if (scrollRef.current) {
			scrollTo(scrollRef.current.scrollHeight);
		}
	}, [scrollTo]);

	// ARIA attributes for accessibility
	const ariaAttributes = {
		role: "region",
		tabIndex: 0,
		"aria-label": "Scrollable content",
	};

	return {
		scrollRef,
		scrollTop,
		scrollTo,
		scrollToTop,
		scrollToBottom,
		ariaAttributes,
	};
}
