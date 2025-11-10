"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Banner {
	label: string;
	title: string;
	description: string;
	imageSrc: string;
	imageAlt: string;
	ctaButtons: Array<{
		label: string;
		onClick: () => void;
		variant?: "primary" | "secondary";
	}>;
}

interface TutorialVideoSectionProps {
	banners: Banner[];
}

export function TutorialVideoSection({ banners }: TutorialVideoSectionProps) {
	const [isVisible, setIsVisible] = useState(true);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [dragStart, setDragStart] = useState<number | null>(null);
	const [dragEnd, setDragEnd] = useState<number | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [direction, setDirection] = useState<"left" | "right">("left");

	const minSwipeDistance = 50;

	const handlePrevious = () => {
		if (!banners || banners.length === 0) return;
		setDirection("right");
		setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
	};

	const handleNext = () => {
		if (!banners || banners.length === 0) return;
		setDirection("left");
		setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
	};

	const handleSwipe = (start: number, end: number) => {
		const distance = start - end;
		const isLeftSwipe = distance > minSwipeDistance;
		const isRightSwipe = distance < -minSwipeDistance;

		if (isLeftSwipe) {
			handleNext();
		} else if (isRightSwipe) {
			handlePrevious();
		}
	};

	const onTouchStart = (e: React.TouchEvent) => {
		setDragEnd(null);
		setDragStart(e.targetTouches[0].clientX);
	};

	const onTouchMove = (e: React.TouchEvent) => {
		setDragEnd(e.targetTouches[0].clientX);
	};

	const onTouchEnd = () => {
		if (!dragStart || !dragEnd) return;
		handleSwipe(dragStart, dragEnd);
	};

	const onMouseDown = (e: React.MouseEvent) => {
		setDragEnd(null);
		setDragStart(e.clientX);
		setIsDragging(true);
	};

	const onMouseMove = (e: React.MouseEvent) => {
		if (!isDragging) return;
		setDragEnd(e.clientX);
	};

	const onMouseUp = () => {
		if (!isDragging) return;
		setIsDragging(false);
		if (!dragStart || !dragEnd) return;
		handleSwipe(dragStart, dragEnd);
	};

	const onMouseLeave = () => {
		if (isDragging) {
			setIsDragging(false);
		}
	};

	// Ensure currentIndex is within bounds
	useEffect(() => {
		if (banners && banners.length > 0 && currentIndex >= banners.length) {
			setCurrentIndex(0);
		}
	}, [banners, currentIndex]);

	if (!isVisible || !banners || banners.length === 0) {
		return null;
	}

	const currentBanner = banners[currentIndex];

	if (!currentBanner) {
		return null;
	}

	return (
		<section
			aria-label="Banner slideshow"
			className="relative rounded-[12px] overflow-visible cursor-grab active:cursor-grabbing"
			onTouchStart={onTouchStart}
			onTouchMove={onTouchMove}
			onTouchEnd={onTouchEnd}
			onMouseDown={onMouseDown}
			onMouseMove={onMouseMove}
			onMouseUp={onMouseUp}
			onMouseLeave={onMouseLeave}
		>
			<div className="relative h-40 md:h-44 w-full rounded-[12px] overflow-hidden">
				{/* Slider container */}
				<div
					key={currentIndex}
					className="relative w-full h-full"
					style={
						{
							"--slide-from": direction === "left" ? "30%" : "-30%",
							animation: "slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
						} as React.CSSProperties
					}
				>
					{/* Background with gradient and image */}
					<div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-pink-900/50">
						<Image
							key={currentIndex}
							src={currentBanner.imageSrc}
							alt={currentBanner.imageAlt}
							fill
							className="object-cover"
							priority
						/>
						<div className="absolute inset-0 bg-background/20" />
					</div>

					{/* Label - top */}
					<div className="absolute top-6 left-8 z-10">
						<span className="inline-block px-3 py-1 rounded-full bg-link-accent text-inverse text-xs font-semibold uppercase w-fit">
							{currentBanner.label}
						</span>
					</div>

					{/* Content */}
					<div className="absolute inset-0 flex items-end justify-between py-6 px-8">
						{/* Left section with title and description */}
						<div className="flex flex-col gap-3 flex-1">
							<h2 className="text-2xl md:text-3xl font-sans text-inverse font-bold">
								{currentBanner.title}
							</h2>
							<p className="text-sm text-inverse/80 max-w-md">
								{currentBanner.description}
							</p>
						</div>

						{/* Right section with CTA buttons */}
						<div className="flex items-center gap-3 shrink-0">
							{currentBanner.ctaButtons.map((button) => (
								<button
									key={button.label}
									type="button"
									onClick={button.onClick}
									className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
										button.variant === "primary"
											? "bg-inverse text-gray-900 hover:bg-inverse/90"
											: "bg-inverse/10 text-inverse border border-inverse/20 hover:bg-inverse/20"
									}`}
								>
									{button.label}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Navigation arrows - only show if multiple banners */}
			{banners.length > 1 && (
				<>
					<button
						type="button"
						onClick={handlePrevious}
						className="absolute -left-8 top-1/2 -translate-y-1/2 text-inverse transition-colors z-10 hover:opacity-80 bg-background/30 rounded-full p-2"
						aria-label="Previous banner"
					>
						<ChevronLeft className="h-5 w-5" />
					</button>
					<button
						type="button"
						onClick={handleNext}
						className="absolute -right-8 top-1/2 -translate-y-1/2 text-inverse transition-colors z-10 hover:opacity-80 bg-background/30 rounded-full p-2"
						aria-label="Next banner"
					>
						<ChevronRight className="h-5 w-5" />
					</button>
				</>
			)}

			{/* Dots indicator - only show if multiple banners */}
			{banners.length > 1 && (
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
					{banners.map((banner, index) => (
						<button
							key={`${banner.label}-${banner.title}`}
							type="button"
							onClick={() => setCurrentIndex(index)}
							className={`h-0.5 rounded-full transition-all ${
								index === currentIndex
									? "w-4 bg-inverse"
									: "w-0.5 bg-inverse/50 hover:bg-inverse/70"
							}`}
							aria-label={`Go to banner ${index + 1}`}
						/>
					))}
				</div>
			)}

			{/* Close button - top right */}
			<button
				type="button"
				onClick={() => setIsVisible(false)}
				className="absolute top-6 right-8 text-inverse transition-colors z-10 hover:opacity-80"
				aria-label="Close tutorial"
			>
				<X className="h-4 w-4" />
			</button>
		</section>
	);
}
