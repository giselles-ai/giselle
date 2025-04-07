import type { StaticImageData } from "next/image";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import step2Gif from "./assets/02.gif";
import step3Gif from "./assets/03.gif";
import step4Gif from "./assets/04.gif";
import step2Arrow from "./assets/step2_arrow.png";
import step5Arror from "./assets/step5_arrow.png";

export type TourStep = {
	target?: string; // CSS selector for the target element (optional)
	title: string;
	content: string;
	placement?: "top" | "bottom" | "left" | "right";
};

interface WorkspaceTourProps {
	steps: TourStep[];
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
}

// Common props shared by all step components
interface TourStepComponentProps {
	step: TourStep;
	currentStep: number;
	totalSteps: number;
	isFirstStep: boolean;
	isLastStep: boolean;
	onPrev: () => void;
	onNext: () => void;
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
	imageSrc?: StaticImageData;
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
								src={imageSrc.src}
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

/**
 * Common components used by all tour steps
 */

// Global styles component with parameterized animation style
const TourGlobalStyles = ({ animationStyle }: { animationStyle: string }) => (
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

// Transparent overlay that closes the tour on click
const TourOverlay = ({ onClose }: { onClose: () => void }) => (
	<div
		className="absolute inset-0 bg-transparent pointer-events-auto"
		onClick={onClose}
		onKeyDown={(e) => e.key === "Escape" && onClose()}
		tabIndex={0}
		role="button"
		aria-label="Close tour"
	/>
);

/**
 * Individual step components
 */

// Step 1: Overview (Default layout with 3 columns)
const TourStep1 = (props: TourStepComponentProps) => {
	const {
		onClose,
		currentStep,
		totalSteps,
		isFirstStep,
		isLastStep,
		onPrev,
		onNext,
	} = props;

	return createPortal(
		<div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
			<TourOverlay onClose={onClose} />

			<TourCard
				size="wide"
				footer={
					<NavigationFooter
						currentStep={currentStep}
						totalSteps={totalSteps}
						isFirstStep={isFirstStep}
						isLastStep={isLastStep}
						onPrev={onPrev}
						onNext={onNext}
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
								Drag to move the canvas
								<br />⌘ (Ctrl) + scroll to
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
								Click nodes to
								<br />
								edit their settings
								<br />
								Click & drag to connect
								<br />
								an input and output
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
									Click & Drag
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
								⌘ + Enter to run a
								<br />
								command when editing a
								<br />
								generation node
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
									⌘ + Enter
								</button>
							</div>
						</div>
					</div>
				</div>
			</TourCard>

			<TourGlobalStyles animationStyle="pulse" />
		</div>,
		document.body,
	);
};

// Step 2: Toolbar tutorial with arrow
const TourStep2 = (props: TourStepComponentProps) => {
	const {
		step,
		onClose,
		currentStep,
		totalSteps,
		isFirstStep,
		isLastStep,
		onPrev,
		onNext,
	} = props;

	return createPortal(
		<div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center">
			<TourOverlay onClose={onClose} />

			<div className="relative pointer-events-none mb-[200px] ml-[550px]">
				<TourCard
					size="small"
					title={step.title}
					content={step.content}
					imageSrc={step2Gif}
					footer={
						<NavigationFooter
							currentStep={currentStep}
							totalSteps={totalSteps}
							isFirstStep={isFirstStep}
							isLastStep={isLastStep}
							onPrev={onPrev}
							onNext={onNext}
						/>
					}
				/>

				<img
					src={step2Arrow.src}
					alt="Arrow pointing to toolbar"
					className="absolute bottom-[-100px] left-[calc(50%-200px)] translate-x-[-50%] z-[60] w-[150px] h-auto pointer-events-none arrow-animation"
				/>
			</div>
			<TourGlobalStyles animationStyle="pulse" />
		</div>,
		document.body,
	);
};

// Step 3: Large centered card with GIF
const TourStep3 = (props: TourStepComponentProps) => {
	const {
		step,
		onClose,
		currentStep,
		totalSteps,
		isFirstStep,
		isLastStep,
		onPrev,
		onNext,
	} = props;

	return createPortal(
		<div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
			<TourOverlay onClose={onClose} />

			<TourCard
				size="large"
				title={step.title}
				content={step.content}
				imageSrc={step3Gif}
				footer={
					<NavigationFooter
						currentStep={currentStep}
						totalSteps={totalSteps}
						isFirstStep={isFirstStep}
						isLastStep={isLastStep}
						onPrev={onPrev}
						onNext={onNext}
					/>
				}
				additionalClassName="tour-card-step3"
			/>

			<TourGlobalStyles animationStyle="pulse" />
		</div>,
		document.body,
	);
};

// Step 4: Small centered card with GIF
const TourStep4 = (props: TourStepComponentProps) => {
	const {
		step,
		onClose,
		currentStep,
		totalSteps,
		isFirstStep,
		isLastStep,
		onPrev,
		onNext,
	} = props;

	return createPortal(
		<div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
			<TourOverlay onClose={onClose} />

			<TourCard
				size="small"
				title={step.title}
				content={step.content}
				imageSrc={step4Gif}
				footer={
					<NavigationFooter
						currentStep={currentStep}
						totalSteps={totalSteps}
						isFirstStep={isFirstStep}
						isLastStep={isLastStep}
						onPrev={onPrev}
						onNext={onNext}
					/>
				}
				additionalClassName="tour-card-step3"
			/>

			<TourGlobalStyles animationStyle="pulse" />
		</div>,
		document.body,
	);
};

// Step 5: Card with arrow in top-right corner
const TourStep5 = (props: TourStepComponentProps) => {
	const {
		step,
		onClose,
		currentStep,
		totalSteps,
		isFirstStep,
		isLastStep,
		onPrev,
		onNext,
	} = props;

	return createPortal(
		<div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-end">
			<TourOverlay onClose={onClose} />

			<div className="relative pointer-events-none mt-[140px] mr-8">
				<TourCard
					size="large"
					title={step.title}
					content={step.content}
					footer={
						<NavigationFooter
							currentStep={currentStep}
							totalSteps={totalSteps}
							isFirstStep={isFirstStep}
							isLastStep={isLastStep}
							onPrev={onPrev}
							onNext={onNext}
						/>
					}
				/>

				<img
					src={step5Arror.src}
					alt="Arrow pointing to tabs"
					className="absolute top-[-110px] left-[calc(50%-190px)] z-[60] w-[150px] h-auto pointer-events-none arrow-animation"
				/>
			</div>

			<TourGlobalStyles animationStyle="pulseStep5" />
		</div>,
		document.body,
	);
};

// Step 6: Final step in bottom-left corner
const TourStep6 = (props: TourStepComponentProps) => {
	const {
		step,
		onClose,
		currentStep,
		totalSteps,
		isFirstStep,
		isLastStep,
		onPrev,
		onNext,
	} = props;

	return createPortal(
		<div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-start">
			<TourOverlay onClose={onClose} />

			<TourCard
				size="small"
				title={step.title}
				content={step.content}
				footer={
					<NavigationFooter
						currentStep={currentStep}
						totalSteps={totalSteps}
						isFirstStep={isFirstStep}
						isLastStep={isLastStep}
						onPrev={onPrev}
						onNext={onNext}
					/>
				}
				additionalClassName="ml-8 mb-8 mt-auto"
			/>

			<TourGlobalStyles animationStyle="pulse" />
		</div>,
		document.body,
	);
};

/**
 * Main WorkspaceTour component that manages state and renders the appropriate step
 */
export const WorkspaceTour = ({
	steps,
	isOpen,
	onOpenChange,
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
		onOpenChange(false);
	};

	// Bail early if conditions aren't met
	if (!isMounted || !isOpen || steps.length === 0) return null;

	// Create common props for all step components
	const stepProps: TourStepComponentProps = {
		step: steps[currentStep],
		currentStep,
		totalSteps: steps.length,
		isFirstStep,
		isLastStep,
		onPrev: handlePrev,
		onNext: handleNext,
		onClose: handleClose,
	};

	// Render the appropriate step component based on current step
	switch (currentStep) {
		case 0:
			return <TourStep1 {...stepProps} />;
		case 1:
			return <TourStep2 {...stepProps} />;
		case 2:
			return <TourStep3 {...stepProps} />;
		case 3:
			return <TourStep4 {...stepProps} />;
		case 4:
			return <TourStep5 {...stepProps} />;
		case 5:
			return <TourStep6 {...stepProps} />;
		default:
			return <TourStep1 {...stepProps} />;
	}
};
