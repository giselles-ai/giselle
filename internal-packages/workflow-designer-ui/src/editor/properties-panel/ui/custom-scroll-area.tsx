import clsx from "clsx/lite";
import {
	type CSSProperties,
	type PropsWithChildren,
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

/**
 * Props for the CustomScrollArea component
 */
interface CustomScrollAreaProps extends PropsWithChildren {
	/**
	 * Additional CSS className
	 */
	className?: string;
	/**
	 * CSS height value or "auto" for content height
	 */
	height?: string | number;
	/**
	 * Hide scrollbar completely (still scrollable)
	 */
	hideScrollbar?: boolean;
	/**
	 * Only show scrollbar on hover
	 */
	showOnHover?: boolean;
	/**
	 * Custom scrollbar width in pixels
	 */
	scrollbarWidth?: number;
	/**
	 * Optional label for screen readers
	 */
	ariaLabel?: string;
	/**
	 * Callback when scroll position changes
	 */
	onScroll?: (event: React.UIEvent<HTMLElement>) => void;
	/**
	 * Additional content to render at the bottom
	 */
	footer?: ReactNode;
}

/**
 * A custom scroll area component with thin, customizable scrollbars
 *
 * Features:
 * - Thin, customizable scrollbars
 * - Optional "show on hover" behavior
 * - Keyboard navigation support
 * - Full accessibility support
 * - Smooth scrolling
 */
export function CustomScrollArea({
	children,
	className,
	height = "auto",
	hideScrollbar = false,
	showOnHover = true,
	scrollbarWidth = 4,
	ariaLabel = "Scrollable content",
	onScroll,
	footer,
}: CustomScrollAreaProps) {
	const scrollRef = useRef<HTMLElement>(null);
	const [isScrolling, setIsScrolling] = useState(false);
	const [showScrollbar, setShowScrollbar] = useState(!showOnHover);

	// Style variables
	const scrollbarColor = "rgba(255, 255, 255, 0.1)";
	const scrollbarHoverColor = "rgba(255, 255, 255, 0.2)";

	// Handle scroll events
	const handleScroll = useCallback(
		(e: React.UIEvent<HTMLElement>) => {
			onScroll?.(e);
			setIsScrolling(true);

			// Reset scrolling state after a delay
			const scrollTimeout = setTimeout(() => {
				setIsScrolling(false);
			}, 1000);

			return () => clearTimeout(scrollTimeout);
		},
		[onScroll],
	);

	// Handle keyboard navigation
	useEffect(() => {
		const currentRef = scrollRef.current;
		if (!currentRef) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (!currentRef) return;

			// Only handle events when the scrollable area is focused
			if (document.activeElement !== currentRef) return;

			// Scroll step values
			const scrollStep = 40;
			const scrollPageStep = 200;

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					currentRef.scrollTop += scrollStep;
					break;
				case "ArrowUp":
					e.preventDefault();
					currentRef.scrollTop -= scrollStep;
					break;
				case "PageDown":
					e.preventDefault();
					currentRef.scrollTop += scrollPageStep;
					break;
				case "PageUp":
					e.preventDefault();
					currentRef.scrollTop -= scrollPageStep;
					break;
				case "Home":
					e.preventDefault();
					currentRef.scrollTop = 0;
					break;
				case "End":
					e.preventDefault();
					currentRef.scrollTop = currentRef.scrollHeight;
					break;
				default:
					return;
			}
		};

		currentRef.addEventListener("keydown", handleKeyDown);
		return () => {
			currentRef.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	// Handle mouse interactions for scrollbar visibility
	const handleMouseEnter = useCallback(() => {
		if (showOnHover) {
			setShowScrollbar(true);
		}
	}, [showOnHover]);

	const handleMouseLeave = useCallback(() => {
		if (showOnHover && !isScrolling) {
			setShowScrollbar(false);
		}
	}, [showOnHover, isScrolling]);

	// Custom scrollbar styles
	const scrollbarStyles = {
		"--scrollbar-width": `${scrollbarWidth}px`,
		"--scrollbar-color": scrollbarColor,
		"--scrollbar-hover-color": scrollbarHoverColor,
		"--scrollbar-opacity": showScrollbar ? "1" : "0",
		"--scrollbar-transition": "opacity 0.2s ease",
		height: typeof height === "number" ? `${height}px` : height,
	} as CSSProperties;

	return (
		<div
			className={clsx("custom-scroll-area", className)}
			style={scrollbarStyles}
		>
			<style jsx>{`
        .custom-scroll-container {
          position: relative;
          overflow-y: auto;
          height: 100%;
          width: 100%;
          scrollbar-width: ${hideScrollbar ? "none" : "thin"};
          scrollbar-color: var(--scrollbar-color) transparent;
        }

        .custom-scroll-container::-webkit-scrollbar {
          width: var(--scrollbar-width);
          opacity: var(--scrollbar-opacity);
          transition: var(--scrollbar-transition);
        }

        .custom-scroll-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scroll-container::-webkit-scrollbar-thumb {
          background-color: var(--scrollbar-color);
          border-radius: 20px;
          opacity: var(--scrollbar-opacity);
          transition: var(--scrollbar-transition);
        }

        .custom-scroll-container:hover::-webkit-scrollbar-thumb,
        .custom-scroll-container::-webkit-scrollbar-thumb:hover {
          background-color: var(--scrollbar-hover-color);
        }

        ${
					hideScrollbar
						? `
          .custom-scroll-container::-webkit-scrollbar {
            display: none;
          }
        `
						: ""
				}
      `}</style>

			<section
				ref={scrollRef}
				className="custom-scroll-container"
				onScroll={handleScroll}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				aria-label={ariaLabel}
			>
				{children}
				{footer}
			</section>
		</div>
	);
}
