"use client";

import {
	type KeyboardEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useState,
} from "react";
import { createPortal } from "react-dom";

type TourStep = {
	target?: string; // CSS selector for the target element (optional)
	title: string;
	content: string;
	placement?: "top" | "bottom" | "left" | "right";
};

interface WorkspaceTourProps {
	steps: TourStep[];
	isOpen: boolean;
	onClose: () => void;
}

interface NavigationFooterProps {
	currentStep: number;
	totalSteps: number;
	isFirstStep: boolean;
	isLastStep: boolean;
	onPrev: () => void;
	onNext: () => void;
}

// Extracted NavigationFooter component
const NavigationFooter = ({
	currentStep,
	totalSteps,
	isFirstStep,
	isLastStep,
	onPrev,
	onNext,
}: NavigationFooterProps) => {
	return (
		<div
			className="flex justify-between items-center border-t border-white/10"
			style={{
				padding: "6px 12px 6px 12px",
				justifyContent: "space-between",
				alignItems: "center",
				alignSelf: "stretch",
			}}
		>
			<div className="text-sm text-white/70">
				{currentStep + 1}/{totalSteps}
			</div>
			<div className="flex gap-1">
				<button
					type="button"
					onClick={onPrev}
					disabled={isFirstStep}
					className={`w-6 h-6 flex items-center justify-center rounded-full border ${
						isFirstStep
							? "border-primary-200/50 text-primary-200/50 cursor-not-allowed"
							: "border-primary-200 text-primary-200 hover:bg-primary-200/10"
					}`}
					style={{
						fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
					}}
				>
					←
				</button>
				{isLastStep ? (
					<button
						type="button"
						onClick={onNext}
						className="px-3 h-6 flex items-center justify-center rounded-full border border-primary-200 text-primary-200 hover:bg-primary-200/10"
						style={{
							fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
						}}
					>
						Finish
					</button>
				) : (
					<button
						type="button"
						onClick={onNext}
						className="w-6 h-6 flex items-center justify-center rounded-full border border-primary-200 text-primary-200 hover:bg-primary-200/10"
						style={{
							fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
						}}
					>
						→
					</button>
				)}
			</div>
		</div>
	);
};

// Common style constants to improve consistency
const CARD_STYLES = {
	base: {
		border: "1px solid rgba(241, 241, 241, 0.20)",
		background:
			"linear-gradient(169deg, rgba(26, 42, 70, 0.60) 0%, rgba(23, 21, 42, 0.60) 97.46%)",
		boxShadow: "0px 34px 84px 0px rgba(0, 0, 0, 0.25)",
		fontFamily: "var(--font-hubot-sans), system-ui, sans-serif",
	},
	small: {
		width: "264px",
		height: "437px",
	},
	large: {
		width: "483px",
		height: "423px",
	},
	wide: {
		width: "792px",
		height: "241px",
	},
};

const BACKGROUND_GRADIENT =
	"radial-gradient(circle at 50% 50%, rgba(30, 50, 80, 1), rgba(20, 25, 40, 1))";

type CardSize = "small" | "large" | "wide";

interface TourCardProps {
	title?: string;
	content?: string;
	size: CardSize;
	imageSrc?: string;
	className?: string;
	footer: ReactNode;
	children?: ReactNode;
	additionalClassName?: string;
}

// Extracted reusable TourCard component
const TourCard = ({
	title,
	content,
	size,
	imageSrc,
	footer,
	children,
	additionalClassName = "",
}: TourCardProps) => {
	const sizeStyles =
		size === "small"
			? CARD_STYLES.small
			: size === "large"
				? CARD_STYLES.large
				: CARD_STYLES.wide;

	return (
		<div
			className={`rounded-2xl shadow-lg pointer-events-auto relative overflow-hidden flex flex-col ${additionalClassName}`}
			style={{
				...CARD_STYLES.base,
				...sizeStyles,
			}}
		>
			{children || (
				<>
					{/* Image area */}
					<div
						className="w-full h-[280px] flex items-center justify-center"
						style={{
							backgroundImage: BACKGROUND_GRADIENT,
						}}
					>
						{imageSrc && (
							<img
								src={imageSrc}
								alt={"Tour step tutorial"}
								className="w-full h-full object-cover"
							/>
						)}
					</div>

					{/* Text area */}
					<div
						className={`flex flex-col ${
							size === "large" ? "justify-start" : "justify-center"
						} p-4 gap-1 flex-grow`}
					>
						{title && (
							<h3
								className="text-white/80 font-semibold mb-1"
								style={{
									fontSize: "16px",
									fontFamily: "var(--font-hubot-sans), system-ui, sans-serif",
								}}
							>
								{title}
							</h3>
						)}
						{content && (
							<p className="text-white/40 my-2" style={{ fontSize: "12px" }}>
								{content}
							</p>
						)}
					</div>
				</>
			)}

			{/* Footer */}
			{footer}
		</div>
	);
};

// Create persistent global styles element
const GlobalStyles = ({ animationStyle }: { animationStyle: string }) => (
	<style jsx global>{`
     .tour-highlight {
       position: relative;
       z-index: 999 !important;
       box-shadow: 0 0 15px 8px rgba(0, 135, 246, 0.6) !important;
       border-radius: 8px !important;
       animation: ${animationStyle} 2s infinite;
       filter: drop-shadow(0 0 30px rgba(0, 135, 246, 0.6)) !important;
       outline: 2px solid rgba(0, 135, 246, 0.8) !important;
     }

     .tour-card-step1, .tour-card-step3 {
       filter: drop-shadow(0 0 15px rgba(0, 135, 246, 0.3));
       animation: card-glow 2s infinite;
     }

     .arrow-animation {
       animation: arrow-pulse 2s infinite;
     }

     @keyframes arrow-pulse {
       0% {
         opacity: 0.8;
         transform: translateY(0);
       }
       50% {
         opacity: 1;
         transform: translateY(-10px);
       }
       100% {
         opacity: 0.8;
         transform: translateY(0);
       }
     }

     @keyframes card-glow {
       0% {
         filter: drop-shadow(0 0 15px rgba(0, 135, 246, 0.3));
       }
       50% {
         filter: drop-shadow(0 0 20px rgba(0, 135, 246, 0.3));
       }
       100% {
         filter: drop-shadow(0 0 15px rgba(0, 135, 246, 0.3));
       }
     }

     @keyframes pulse {
       0% {
         box-shadow: 0 0 10px 3px rgba(0, 135, 246, 0.4) !important;
         filter: drop-shadow(0 0 20px rgba(0, 135, 246, 0.4)) !important;
       }
       50% {
         box-shadow: 0 0 12px 6px rgba(0, 135, 246, 0.5) !important;
         filter: drop-shadow(0 0 20px rgba(0, 135, 246, 0.5)) !important;
       }
       100% {
         box-shadow: 0 0 10px 3px rgba(0, 135, 246, 0.4) !important;
         filter: drop-shadow(0 0 20px rgba(0, 135, 246, 0.4)) !important;
       }
     }

     @keyframes pulseStep5 {
       0% {
         box-shadow: 0 0 10px 3px rgba(0, 135, 246, 0.4) !important;
         filter: drop-shadow(0 0 10px rgba(0, 135, 246, 0.4)) !important;
       }
       50% {
         box-shadow: 0 0 12px 6px rgba(0, 135, 246, 0.5) !important;
         filter: drop-shadow(0 0 10px rgba(0, 135, 246, 0.5)) !important;
       }
       100% {
         box-shadow: 0 0 10px 3px rgba(0, 135, 246, 0.4) !important;
         filter: drop-shadow(0 0 10px rgba(0, 135, 246, 0.4)) !important;
       }
     }
   `}</style>
);

const TourOverlay = ({
	onClose,
	onKeyDown,
}: {
	onClose: () => void;
	onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
}) => (
	<div
		className="absolute inset-0 bg-transparent pointer-events-auto"
		onClick={onClose}
		onKeyDown={(e) => {}}
		tabIndex={0}
		role="button"
		aria-label="Close tour"
	/>
);

export const WorkspaceTour = ({
	steps,
	isOpen,
	onClose,
}: WorkspaceTourProps) => {
	const [currentStep, setCurrentStep] = useState(0);
	// Determine if this is the first step
	const isFirstStep = currentStep === 0;

	// Determine if this is the last step
	const isLastStep = currentStep === steps.length - 1;

	// Using useEffect for hydration safety
	const [isMounted, setIsMounted] = useState(false);
	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Get blur size for highlight effect
	const getBlurSize = useCallback((): string => {
		return currentStep === 4 ? "10px" : "20px";
	}, [currentStep]);

	// Get pulse animation name based on step
	const getPulseAnimation = useCallback((): string => {
		return currentStep === 4 ? "pulseStep5" : "pulse";
	}, [currentStep]);

	// Handle element highlighting
	useEffect(() => {
		if (!isOpen || steps.length === 0) return;

		// Skip if current step has no target or is invalid
		if (!steps[currentStep]) return;

		const currentStepTarget = steps[currentStep].target;
		const currentTarget = currentStepTarget
			? document.querySelector(currentStepTarget)
			: null;

		if (currentTarget) {
			// Apply highlight styles
			const blurSize = getBlurSize();
			currentTarget.classList.add("tour-highlight");
			(currentTarget as HTMLElement).style.setProperty(
				"box-shadow",
				"0 0 10px 5px rgba(0, 135, 246, 0.5)",
				"important",
			);
			(currentTarget as HTMLElement).style.removeProperty("outline");
			(currentTarget as HTMLElement).style.setProperty(
				"z-index",
				"9999",
				"important",
			);
			(currentTarget as HTMLElement).style.setProperty(
				"position",
				"relative",
				"important",
			);
			(currentTarget as HTMLElement).style.setProperty(
				"filter",
				`drop-shadow(0 0 ${blurSize} rgba(0, 135, 246, 0.5))`,
				"important",
			);
		}

		// Clean up function to remove highlight
		return () => {
			if (!steps[currentStep]) return;
			const currentStepTarget = steps[currentStep].target;
			const currentTarget = currentStepTarget
				? document.querySelector(currentStepTarget)
				: null;
			if (currentTarget) {
				currentTarget.classList.remove("tour-highlight");
				(currentTarget as HTMLElement).style.removeProperty("box-shadow");
				(currentTarget as HTMLElement).style.removeProperty("filter");
				(currentTarget as HTMLElement).style.removeProperty("z-index");
			}
		};
	}, [isOpen, currentStep, steps, getBlurSize]);

	const handleNext = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1);
		} else {
			handleClose();
		}
	};

	const handlePrev = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const handleClose = () => {
		setCurrentStep(0);
		onClose();
	};

	// Bail early if conditions aren't met
	if (!isMounted || !isOpen || steps.length === 0) return null;

	// Special layout for step 2 (index 1)
	if (currentStep === 1) {
		return createPortal(
			<div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center">
				<TourOverlay
					onClose={handleClose}
					onKeyDown={(e) => e.key === "Escape" && handleClose()}
				/>

				<div className="relative pointer-events-none mb-[200px] ml-[550px]">
					<TourCard
						size="small"
						title={steps[currentStep].title}
						content={steps[currentStep].content}
						imageSrc="/02.gif"
						footer={
							<NavigationFooter
								currentStep={currentStep}
								totalSteps={steps.length}
								isFirstStep={isFirstStep}
								isLastStep={isLastStep}
								onPrev={handlePrev}
								onNext={handleNext}
							/>
						}
					/>

					<img
						src="/step2_arrow.png"
						alt="Arrow pointing to toolbar"
						className="absolute bottom-[-100px] left-[calc(50%-200px)] translate-x-[-50%] z-[60] w-[150px] h-auto pointer-events-none arrow-animation"
					/>
				</div>
				<GlobalStyles animationStyle="pulse" />
			</div>,
			document.body,
		);
	}

	// Special layout for step 3 (index 2)
	if (currentStep === 2) {
		return createPortal(
			<div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
				<TourOverlay
					onClose={handleClose}
					onKeyDown={(e) => e.key === "Escape" && handleClose()}
				/>

				<TourCard
					size="large"
					title={steps[currentStep].title}
					content={steps[currentStep].content}
					imageSrc="/03.gif"
					footer={
						<NavigationFooter
							currentStep={currentStep}
							totalSteps={steps.length}
							isFirstStep={isFirstStep}
							isLastStep={isLastStep}
							onPrev={handlePrev}
							onNext={handleNext}
						/>
					}
					additionalClassName="tour-card-step3"
				/>

				<GlobalStyles animationStyle="pulse" />
			</div>,
			document.body,
		);
	}

	// Special layout for step 4 (index 3)
	if (currentStep === 3) {
		return createPortal(
			<div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
				<TourOverlay
					onClose={handleClose}
					onKeyDown={(e) => e.key === "Escape" && handleClose()}
				/>

				<TourCard
					size="small"
					title={steps[currentStep].title}
					content={steps[currentStep].content}
					imageSrc="/04.gif"
					footer={
						<NavigationFooter
							currentStep={currentStep}
							totalSteps={steps.length}
							isFirstStep={isFirstStep}
							isLastStep={isLastStep}
							onPrev={handlePrev}
							onNext={handleNext}
						/>
					}
					additionalClassName="tour-card-step3"
				/>

				<GlobalStyles animationStyle="pulse" />
			</div>,
			document.body,
		);
	}

	// Special layout for step 5 (index 4)
	if (currentStep === 4) {
		return createPortal(
			<div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-end">
				<TourOverlay
					onClose={handleClose}
					onKeyDown={(e) => e.key === "Escape" && handleClose()}
				/>

				<div className="relative pointer-events-none mt-[140px] mr-8">
					<TourCard
						size="large"
						title={steps[currentStep].title}
						content={steps[currentStep].content}
						footer={
							<NavigationFooter
								currentStep={currentStep}
								totalSteps={steps.length}
								isFirstStep={isFirstStep}
								isLastStep={isLastStep}
								onPrev={handlePrev}
								onNext={handleNext}
							/>
						}
					/>

					<img
						src="/step5_arrow.png"
						alt="Arrow pointing to tabs"
						className="absolute top-[-110px] left-[calc(50%-190px)] z-[60] w-[150px] h-auto pointer-events-none arrow-animation"
					/>
				</div>

				<GlobalStyles animationStyle="pulseStep5" />
			</div>,
			document.body,
		);
	}

	// Special layout for step 6 (index 5)
	if (currentStep === 5) {
		return createPortal(
			<div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-start">
				<TourOverlay
					onClose={handleClose}
					onKeyDown={(e) => e.key === "Escape" && handleClose()}
				/>

				<TourCard
					size="small"
					title={steps[currentStep].title}
					content={steps[currentStep].content}
					footer={
						<NavigationFooter
							currentStep={currentStep}
							totalSteps={steps.length}
							isFirstStep={isFirstStep}
							isLastStep={isLastStep}
							onPrev={handlePrev}
							onNext={handleNext}
						/>
					}
					additionalClassName="ml-8 mb-8 mt-auto"
				/>

				<GlobalStyles animationStyle="pulse" />
			</div>,
			document.body,
		);
	}

	// Default layout (for step 1, etc.)
	return createPortal(
		<div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
			<TourOverlay
				onClose={handleClose}
				onKeyDown={(e) => e.key === "Escape" && handleClose()}
			/>

			<TourCard
				size="wide"
				footer={
					<NavigationFooter
						currentStep={currentStep}
						totalSteps={steps.length}
						isFirstStep={isFirstStep}
						isLastStep={isLastStep}
						onPrev={handlePrev}
						onNext={handleNext}
					/>
				}
				additionalClassName="tour-card-step1"
			>
				<div className="relative z-10 h-full w-full flex flex-col justify-between">
					{/* 3-column main content */}
					<div className="grid grid-cols-3 h-full">
						{/* Left column: Navigation */}
						<div className="flex flex-col justify-center p-4 gap-1 border-r border-white/10">
							<h3
								className="text-white/80 font-semibold mb-1 text-center"
								style={{
									fontSize: "16px",
									fontFamily: "var(--font-hubot-sans), system-ui, sans-serif",
								}}
							>
								Navigation
							</h3>
							<p
								className="text-white/40 my-2 text-center"
								style={{ fontSize: "12px" }}
							>
								Drag to move canvas
								<br />
								⌘(Ctrl) + scroll to
								<br />
								zoom in/out
							</p>
							<div className="flex w-full mt-1 justify-center">
								<button
									type="button"
									className="text-white/85 text-xs rounded-full flex justify-center items-center gap-1"
									style={{
										padding: "3px 12px",
										borderRadius: "20px",
										background: "rgba(255, 255, 255, 0.1)",
									}}
								>
									⌘ + scroll
								</button>
							</div>
						</div>

						{/* Middle column: Node Controls */}
						<div className="flex flex-col justify-center p-4 gap-1 border-r border-white/10">
							<h3
								className="text-white/80 font-semibold mb-1 text-center"
								style={{
									fontSize: "16px",
									fontFamily: "var(--font-hubot-sans), system-ui, sans-serif",
								}}
							>
								Node Controls
							</h3>
							<p
								className="text-white/40 my-2 text-center"
								style={{ fontSize: "12px" }}
							>
								Double-tap nodes to open
								<br />
								setting Drag & drop
								<br />
								to connect
							</p>
							<div className="flex w-full mt-1 justify-center">
								<button
									type="button"
									className="text-white/85 text-xs rounded-full flex justify-center items-center gap-1"
									style={{
										padding: "3px 12px",
										borderRadius: "20px",
										background: "rgba(255, 255, 255, 0.1)",
									}}
								>
									Double-tap
								</button>
							</div>
						</div>

						{/* Right column: Run Commands */}
						<div className="flex flex-col justify-center p-4 gap-1">
							<h3
								className="text-white/80 font-semibold mb-1 text-center"
								style={{
									fontSize: "16px",
									fontFamily: "var(--font-hubot-sans), system-ui, sans-serif",
								}}
							>
								Run Commands
							</h3>
							<p
								className="text-white/40 my-2 text-center"
								style={{ fontSize: "12px" }}
							>
								⌘ + Enter to Run
								<br />⌘ + Shift + Enter to
								<br />
								run entire workflows
							</p>
							<div className="flex w-full mt-1 justify-center">
								<button
									type="button"
									className="text-white/85 text-xs rounded-full flex justify-center items-center gap-1"
									style={{
										padding: "3px 12px",
										borderRadius: "20px",
										background: "rgba(255, 255, 255, 0.1)",
									}}
								>
									⌘ + ⇧ + ↵
								</button>
							</div>
						</div>
					</div>
				</div>
			</TourCard>

			<GlobalStyles animationStyle="pulse" />
		</div>,
		document.body,
	);
};
