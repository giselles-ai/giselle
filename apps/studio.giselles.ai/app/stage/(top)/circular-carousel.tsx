"use client";

import {
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./circular-carousel.module.css";
import { TeamCard } from "./team-card";

interface CarouselItem {
	id: string;
	name: string;
	profileImageUrl?: string;
}

interface CircularCarouselProps {
	items: CarouselItem[];
	selectedId?: string;
	onItemSelect?: (item: CarouselItem) => void;
	onItemDeselect?: () => void;
}

// Animation states for center card
type CenterCardState =
	| "normal"
	| "selected"
	| "animating-down"
	| "inserted"
	| "animating-up";

export function CircularCarousel({
	items,
	selectedId: _selectedId,
	onItemSelect,
	onItemDeselect,
}: CircularCarouselProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(800);
	const [currentIndex, setCurrentIndex] = useState(
		items.length > 0 ? Math.floor(items.length / 2) : 0,
	);
	const [centerCardState, setCenterCardState] =
		useState<CenterCardState>("normal");
	const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);

	// Drag state
	const [isDragging, setIsDragging] = useState(false);
	const [dragStart, setDragStart] = useState(0);
	const [dragOffset, setDragOffset] = useState(0);
	const [verticalDragStart, setVerticalDragStart] = useState(0);
	const [verticalDragOffset, setVerticalDragOffset] = useState(0);

	// Calculate visible cards based on container width with specific breakpoints
	const calculateVisibleCards = (width: number) => {
		if (width === 0) return Math.min(5, items.length); // Default while measuring

		let visibleCards: number;
		if (width < 500) {
			visibleCards = 3; // Small screens
		} else if (width < 700) {
			visibleCards = 5; // Medium screens
		} else {
			visibleCards = 7; // Large screens
		}

		return Math.min(visibleCards, items.length);
	};

	// Carousel settings
	const visibleCards = calculateVisibleCards(containerWidth);
	const radius = 400;
	const centerX = 0;
	const centerY = 510;

	// Handle container resize
	useEffect(() => {
		const updateContainerWidth = () => {
			if (containerRef.current) {
				const width = containerRef.current.offsetWidth;
				setContainerWidth(width);
			}
		};

		// Use ResizeObserver for more accurate detection
		const resizeObserver = new ResizeObserver(() => {
			updateContainerWidth();
		});

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
			updateContainerWidth(); // Initial measurement
		}

		// Fallback for initial load
		const timer = setTimeout(updateContainerWidth, 100);

		return () => {
			resizeObserver.disconnect();
			clearTimeout(timer);
		};
	}, []);

	// Update current index when visible cards change
	useEffect(() => {
		if (items.length === 0) return;

		const maxIndex = Math.max(0, items.length - 1);
		const halfVisible = Math.floor(visibleCards / 2);
		const minCurrentIndex = halfVisible;
		const maxCurrentIndex = Math.max(minCurrentIndex, maxIndex - halfVisible);

		setCurrentIndex((prev) => {
			if (prev < minCurrentIndex) {
				return minCurrentIndex;
			} else if (prev > maxCurrentIndex) {
				return maxCurrentIndex;
			}
			return prev;
		});
	}, [visibleCards, items.length]);

	// Reset animation state when navigating
	const resetAnimationState = useCallback(() => {
		setCenterCardState("normal");
		setActiveCardIndex(null);
	}, []);

	// Auto-navigate to selected item when selectedId changes
	useEffect(() => {
		if (_selectedId && items.length > 0) {
			const selectedIndex = items.findIndex((item) => item.id === _selectedId);
			if (selectedIndex !== -1 && selectedIndex !== currentIndex) {
				setCurrentIndex(selectedIndex);
				resetAnimationState();

				// Auto-select the center item after navigation with full animation
				setTimeout(() => {
					if (onItemSelect) {
						onItemSelect(items[selectedIndex]);
					}

					// Simulate card click animation sequence
					setCenterCardState("selected");
					setActiveCardIndex(selectedIndex);

					// Brief delay to show selection state, then start slide down animation
					setTimeout(() => {
						setCenterCardState("animating-down");

						// Start slide down animation
						setTimeout(() => {
							setCenterCardState("inserted");
						}, 600);
					}, 300); // Show selection state for 300ms before animation
				}, 100);
			}
		}
	}, [_selectedId, items, currentIndex, onItemSelect, resetAnimationState]);

	// Get visible cards around current index
	const getVisibleCards = () => {
		const cards = [];
		const halfVisible = Math.floor(visibleCards / 2);

		for (let i = -halfVisible; i <= halfVisible; i++) {
			const index = currentIndex + i;
			if (index >= 0 && index < items.length) {
				cards.push({
					item: items[index],
					originalIndex: index,
					positionIndex: i,
				});
			}
		}
		return cards;
	};

	// Calculate card position on semicircle
	const getCardPosition = (positionIndex: number) => {
		const isCenter = positionIndex === 0;

		// Semicircle angle calculation - tighter arc to bring cards closer
		const totalAngle = visibleCards >= 5 ? Math.PI * 0.6 : Math.PI * 0.2; // Adjusted arc spacing
		const angleStep = totalAngle / (visibleCards - 1);
		const angle = Math.PI / 2 + angleStep * positionIndex;

		// Add drag offset
		const dragAngle = isDragging ? -dragOffset * 0.008 : 0;
		const finalAngle = angle + dragAngle;

		// Position on semicircle - adjust Y so card bottom follows the arc
		const x = centerX + radius * Math.cos(finalAngle);
		const y = centerY - radius * Math.sin(finalAngle) - 144; // Offset by card height so bottom edge aligns with arc

		// Rotate card to tilt outward from center
		const cardRotation = -(finalAngle - Math.PI / 2) * (180 / Math.PI);

		// Visual effects - edge cards more visible but smaller
		const distanceFromCenter = Math.abs(positionIndex);
		const isEdgeCard = Math.abs(positionIndex) >= Math.floor(visibleCards / 2);
		const opacity = isEdgeCard
			? Math.max(0.4, 1 - distanceFromCenter * 0.2)
			: Math.max(0.6, 1 - distanceFromCenter * 0.15);
		const scale = 1.0; // All cards same size
		const zIndex = isCenter ? 50 : Math.max(1, 30 - distanceFromCenter * 5);

		return {
			x,
			y,
			rotation: cardRotation,
			scale,
			opacity,
			zIndex,
			isCenter,
		};
	};

	// Navigation functions
	const moveLeft = useCallback(() => {
		if (currentIndex > 0) {
			// If there's currently an inserted item, deselect it first
			if (centerCardState === "inserted" && onItemDeselect) {
				onItemDeselect();
			}
			setCurrentIndex(currentIndex - 1);
			resetAnimationState();
		}
	}, [currentIndex, resetAnimationState, onItemDeselect, centerCardState]);

	const moveRight = useCallback(() => {
		if (currentIndex < items.length - 1) {
			// If there's currently an inserted item, deselect it first
			if (centerCardState === "inserted" && onItemDeselect) {
				onItemDeselect();
			}
			setCurrentIndex(currentIndex + 1);
			resetAnimationState();
		}
	}, [
		currentIndex,
		items.length,
		resetAnimationState,
		onItemDeselect,
		centerCardState,
	]);

	// Handle deselection animation
	const handleDeselect = useCallback(
		(cardIndex: number) => {
			setCenterCardState("animating-up");
			setActiveCardIndex(cardIndex);

			// Call deselect callback
			if (onItemDeselect) {
				onItemDeselect();
			}

			// Complete animation and reset state
			setTimeout(() => {
				resetAnimationState();
			}, 600);
		},
		[onItemDeselect, resetAnimationState],
	);

	// Handle center card selection
	const handleCenterCardSelect = useCallback(
		(cardIndex: number) => {
			if (centerCardState === "inserted" && activeCardIndex === cardIndex) {
				// Deselect inserted card
				handleDeselect(cardIndex);
			} else if (centerCardState === "normal") {
				// Select card: show blue frame first
				setCenterCardState("selected");
				setActiveCardIndex(cardIndex);

				if (onItemSelect) {
					onItemSelect(items[cardIndex]);
				}

				// Brief delay to show selection state, then animate down
				setTimeout(() => {
					setCenterCardState("animating-down");

					// Complete animation and show inserted state
					setTimeout(() => {
						setCenterCardState("inserted");
					}, 600);
				}, 300);
			}
		},
		[centerCardState, activeCardIndex, onItemSelect, items, handleDeselect],
	);

	// Handle card click
	const handleCardClick = useCallback(
		(originalIndex: number, isCenter: boolean) => {
			if (isCenter) {
				handleCenterCardSelect(originalIndex);
			} else {
				// Move clicked card to center
				// If there's currently an inserted item, deselect it first
				if (centerCardState === "inserted" && onItemDeselect) {
					onItemDeselect();
				}
				setCurrentIndex(originalIndex);
				resetAnimationState();
			}
		},
		[
			handleCenterCardSelect,
			resetAnimationState,
			onItemDeselect,
			centerCardState,
		],
	);

	// Drag handlers
	const handleDragStart = (clientX: number, clientY: number) => {
		setIsDragging(true);
		setDragStart(clientX);
		setDragOffset(0);
		setVerticalDragStart(clientY);
		setVerticalDragOffset(0);
	};

	const handleDragMove = (clientX: number, clientY: number) => {
		if (!isDragging) return;
		const distance = clientX - dragStart;
		const verticalDistance = clientY - verticalDragStart;
		setDragOffset(distance);
		setVerticalDragOffset(verticalDistance);
	};

	const handleDragEnd = () => {
		if (!isDragging) return;

		const threshold = 50;
		const verticalThreshold = 60;

		// Check for downward swipe on center card (mobile card selection)
		if (
			verticalDragOffset > verticalThreshold &&
			Math.abs(dragOffset) < threshold
		) {
			const centerCard = visibleCardsList.find(
				(card) => card.positionIndex === 0,
			);
			if (centerCard) {
				handleCenterCardSelect(centerCard.originalIndex);
			}
		}
		// Check for horizontal swipe (carousel navigation)
		else if (Math.abs(dragOffset) > threshold) {
			if (dragOffset > 0) {
				moveRight();
			} else {
				moveLeft();
			}
		}

		setIsDragging(false);
		setDragStart(0);
		setDragOffset(0);
		setVerticalDragStart(0);
		setVerticalDragOffset(0);
	};

	// Mouse events
	const handleMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
		handleDragStart(e.clientX, e.clientY);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		handleDragMove(e.clientX, e.clientY);
	};

	// Touch events
	const handleTouchStart = (e: React.TouchEvent) => {
		handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
	};

	const handleTouchMove = (e: React.TouchEvent) => {
		handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
	};

	const visibleCardsList = getVisibleCards();
	const centerCard = visibleCardsList.find((card) => card.positionIndex === 0);

	// Keyboard navigation
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Only handle arrow keys when the carousel is focused or no other input is focused
			if (
				document.activeElement?.tagName === "INPUT" ||
				document.activeElement?.tagName === "TEXTAREA"
			) {
				return;
			}

			switch (e.key) {
				case "ArrowLeft":
					e.preventDefault();
					moveLeft();
					break;
				case "ArrowRight":
					e.preventDefault();
					moveRight();
					break;
				case "Enter":
				case " ":
					if (centerCard) {
						e.preventDefault();
						handleCenterCardSelect(centerCard.originalIndex);
					}
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [moveLeft, moveRight, centerCard, handleCenterCardSelect]);

	// Optimized style objects to prevent recreation on each render
	const containerStyle = {
		height: "250px",
	} as const;

	const emptyStateContainerStyle = {
		height: "250px",
	} as const;

	const carouselStyle = {
		userSelect: "none" as const,
		WebkitUserSelect: "none" as const,
	};

	// Optimized gradient style
	const gradientBackgroundStyle = {
		width: "108px",
		height: "95px",
		background:
			"radial-gradient(ellipse 108px 80px at 50% 100%, rgba(107, 143, 240, 1) 0%, rgba(107, 143, 240, 0.8) 20%, rgba(107, 143, 240, 0.5) 40%, rgba(107, 143, 240, 0.2) 70%, transparent 100%)",
		filter: "blur(2px)",
	} as const;

	// Show empty state when no items available
	if (items.length === 0) {
		return (
			<div
				ref={containerRef}
				className="relative w-full overflow-hidden select-none"
				style={emptyStateContainerStyle}
			>
				<div className="text-center">
					<p className="text-white-400 text-[14px] font-medium font-['DM_Sans']">
						No executable apps available. Please select a different team or
						create a new app.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="relative w-full overflow-hidden"
			style={containerStyle}
		>
			{/* Carousel container */}
			<section
				aria-label="Team app carousel"
				aria-describedby="carousel-instructions"
				className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				onMouseDown={handleMouseDown}
				onMouseMove={handleMouseMove}
				onMouseUp={handleDragEnd}
				onMouseLeave={handleDragEnd}
				onTouchStart={handleTouchStart}
				onTouchMove={handleTouchMove}
				onTouchEnd={handleDragEnd}
				style={carouselStyle}
			>
				{visibleCardsList.map(({ item, originalIndex, positionIndex }) => {
					const position = getCardPosition(positionIndex);
					const isActiveCard =
						activeCardIndex === originalIndex && position.isCenter;
					const isAnimatingDown =
						centerCardState === "animating-down" && isActiveCard;
					const isAnimatingUp =
						centerCardState === "animating-up" && isActiveCard;
					const isInserted = centerCardState === "inserted" && isActiveCard;

					return (
						<button
							key={`${item.id}-${originalIndex}`}
							type="button"
							aria-label={`Select ${item.name}`}
							className="absolute cursor-pointer select-none border-none bg-transparent p-0"
							style={{
								transform:
									isAnimatingDown || isInserted
										? `translate(${position.x}px, ${position.y + 170}px) rotate(0deg) scale(${position.scale})`
										: `translate(${position.x}px, ${position.y}px) rotate(${position.rotation}deg) scale(${position.scale})`,
								zIndex: position.zIndex,
								opacity: position.opacity,
								transition:
									isAnimatingDown || isAnimatingUp
										? "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease"
										: isDragging
											? "none"
											: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease",
							}}
							onClick={() => handleCardClick(originalIndex, position.isCenter)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleCardClick(originalIndex, position.isCenter);
								}
							}}
						>
							<div
								className={
									isInserted ? `relative ${styles.pulseAnimation}` : "relative"
								}
							>
								<TeamCard
									team={{
										id: item.id as `tm_${string}`,
										name: item.name,
									}}
								/>
							</div>
						</button>
					);
				})}
			</section>

			{/* Hidden instructions for screen readers */}
			<div id="carousel-instructions" className="sr-only">
				Use left and right arrow keys to navigate between apps. Press Enter or
				Space to select the center app.
			</div>

			{/* Gray selection frame - normal state */}
			{centerCard && centerCardState === "normal" && (
				<div
					className="absolute left-1/2 top-1/2 pointer-events-none z-40"
					style={{
						width: "98px", // 90px card + 4px padding on each side
						height: "128px", // 120px card + 4px padding on each side
						borderRadius: "4px 4px 16px 4px",
						border: "2px solid #2E2E2E",
						transform: `translate(-50%, -50%) translate(${centerX}px, ${centerY - radius - 144}px)`,
					}}
				/>
			)}

			{/* Normal state: Arrow below gray frame */}
			{centerCard && centerCardState === "normal" && (
				<button
					type="button"
					aria-label="Select current app"
					className="absolute left-1/2 transform -translate-x-1/2 text-center z-60 cursor-pointer border-none bg-transparent p-0"
					style={{ top: "75%" }}
					onClick={() => {
						if (centerCard) {
							handleCenterCardSelect(centerCard.originalIndex);
						}
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							if (centerCard) {
								handleCenterCardSelect(centerCard.originalIndex);
							}
						}
					}}
				>
					<div className="text-gray-300 text-lg font-medium mb-1 tracking-wide flex justify-center">
						<ChevronDown size={20} />
					</div>
					<div className="mx-auto" style={gradientBackgroundStyle} />
				</button>
			)}

			{/* Blue selection frame - selected state */}
			{centerCard &&
				centerCardState === "selected" &&
				activeCardIndex === centerCard.originalIndex && (
					<div
						className="absolute left-1/2 top-1/2 pointer-events-none z-40"
						style={{
							width: "98px", // 90px card + 4px padding on each side
							height: "128px", // 120px card + 4px padding on each side
							borderRadius: "4px 4px 16px 4px",
							border: "2px solid var(--primary400, #6B8FF0)",
							boxShadow: "1px 1px 16px 8px rgba(107, 143, 240, 0.25)",
							transform: `translate(-50%, -50%) translate(${centerX}px, ${centerY - radius - 144}px)`,
						}}
					/>
				)}

			{/* Left arrow */}
			<button
				type="button"
				aria-label="Navigate to previous app"
				onClick={moveRight}
				disabled={currentIndex === items.length - 1}
				className="hidden md:flex absolute left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 border border-white hover:bg-white/10 rounded-full items-center justify-center text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-50"
			>
				<ChevronLeft size={20} />
			</button>

			{/* Right arrow */}
			<button
				type="button"
				aria-label="Navigate to next app"
				onClick={moveLeft}
				disabled={currentIndex === 0}
				className="hidden md:flex absolute right-6 top-1/2 transform -translate-y-1/2 w-10 h-10 border border-white hover:bg-white/10 rounded-full items-center justify-center text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-50"
			>
				<ChevronRight size={20} />
			</button>

			{/* REJECT state: Arrow above inserted card */}
			{centerCard &&
				centerCardState === "inserted" &&
				activeCardIndex === centerCard.originalIndex && (
					<button
						type="button"
						aria-label="Deselect current app"
						className="absolute left-1/2 top-1/2 pointer-events-auto z-60 cursor-pointer border-none bg-transparent p-0"
						style={{
							transform: `translate(-50%, -50%) translate(${centerX}px, ${centerY - radius - 144 + 90}px)`,
						}}
						onClick={() => {
							if (centerCard) {
								handleDeselect(centerCard.originalIndex);
							}
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								if (centerCard) {
									handleDeselect(centerCard.originalIndex);
								}
							}
						}}
					>
						<div className="text-gray-300 text-lg font-medium flex justify-center">
							<ChevronUp size={20} />
						</div>
					</button>
				)}
		</div>
	);
}
