"use client";

import { useEffect, useState } from "react";
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

export const WorkspaceTour = ({ steps, isOpen, onClose }: WorkspaceTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Function to get blur size (10px for step 5, 20px for others)
  const getBlurSize = (): string => {
    return currentStep === 4 ? "10px" : "20px";
  };

  // Function to get pulse animation name
  const getPulseAnimation = (): string => {
    return currentStep === 4 ? "pulseStep5" : "pulse";
  };

  // Enable highlight feature
  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    // Check target elements for all steps
    console.log("Current step:", currentStep + 1);
    console.log("All targets:");
    steps.forEach((step, idx) => {
      const target = step.target ? document.querySelector(step.target) : null;
      console.log(`Step ${idx + 1}:`, {
        target: step.target,
        found: target ? "✅ Element found" : "❌ Element not found"
      });
    });

    // Get and highlight the target element
    // Add check to prevent undefined error
    if (!steps[currentStep]) return;
    
    const currentStepTarget = steps[currentStep].target;
    const currentTarget = currentStepTarget ? document.querySelector(currentStepTarget) : null;
    
    console.log(`[Tour Highlight] Step ${currentStep + 1}:`, {
      target: currentStepTarget,
      foundElement: currentTarget ? "✅ Element found" : "❌ Element not found",
      element: currentTarget
    });
    
    if (currentTarget) {
      currentTarget.classList.add("tour-highlight");
      console.log("Highlight applied: ", currentTarget);
      
      // Force apply styles (10px blur for step 5, 20px for others)
      const blurSize = getBlurSize();
      (currentTarget as HTMLElement).style.setProperty("box-shadow", "0 0 10px 5px rgba(0, 135, 246, 0.5)", "important");
      (currentTarget as HTMLElement).style.removeProperty("outline");
      (currentTarget as HTMLElement).style.setProperty("z-index", "9999", "important");
      (currentTarget as HTMLElement).style.setProperty("position", "relative", "important");
      (currentTarget as HTMLElement).style.setProperty("filter", `drop-shadow(0 0 ${blurSize} rgba(0, 135, 246, 0.5))`, "important");
    } else if (currentStepTarget) {
      console.error("Target element not found:", currentStepTarget);
      
      // Try alternative selectors to find elements
      const alternativeSelectors = [".View-selector", "[role='tablist']", ".header-tabs", ".view-switcher"];
      alternativeSelectors.forEach(selector => {
        const el = document.querySelector(selector);
        console.log(`Alternative selector ${selector}:`, el ? "✅ Element found" : "❌ Element not found");
      });
    }

    // Clean up function to remove highlight
    return () => {
      if (!steps[currentStep]) return;
      const currentStepTarget = steps[currentStep].target;
      const currentTarget = currentStepTarget ? document.querySelector(currentStepTarget) : null;
      if (currentTarget) {
        currentTarget.classList.remove("tour-highlight");
        (currentTarget as HTMLElement).style.removeProperty("box-shadow");
        (currentTarget as HTMLElement).style.removeProperty("filter");
        (currentTarget as HTMLElement).style.removeProperty("z-index");
      }
    };
  }, [isOpen, currentStep, steps]);

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

  // Function to determine button disabled state (avoid TypeScript errors)
  const isFirstStep = (): boolean => {
    return currentStep === 0;
  };

  if (!mounted || !isOpen || steps.length === 0) return null;

  // Display different layouts based on current step
  if (currentStep === 1) {
    // Special layout for step 2
    return createPortal(
      <div className="fixed inset-0 z-50 pointer-events-none flex items-end justify-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

        {/* Group card and arrow - positioned at bottom center */}
        <div className="relative pointer-events-none mb-[200px] ml-[550px]">
          {/* Step 2 special card - center positioned */}
          <div
            className="rounded-2xl shadow-lg pointer-events-auto relative overflow-hidden flex flex-col"
            style={{
              width: '264px',
              height: '437px',
              border: '1px solid rgba(241, 241, 241, 0.20)',
              background: 'linear-gradient(169deg, rgba(26, 42, 70, 0.60) 0%, rgba(23, 21, 42, 0.60) 97.46%)',
              boxShadow: '0px 34px 84px 0px rgba(0, 0, 0, 0.25)',
              fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif',
            }}
          >
            {/* Image area */}
            <div 
              className="w-full h-[280px] flex items-center justify-center"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 50, 80, 1), rgba(20, 25, 40, 1))'
              }}
            >
              <img src="/02.gif" alt="Step 2 Tutorial" className="w-full h-full object-cover" />
            </div>

            {/* Text area */}
            <div className="flex flex-col justify-center p-4 gap-1 flex-grow">
              <h3 className="text-white/80 font-semibold mb-1" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif' }}>
                {steps[currentStep].title}
              </h3>
              <div className="text-white/40 my-2" style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: steps[currentStep].content }} />
            </div>

            {/* Footer: Page navigation */}
            <div 
              className="flex justify-between items-center border-t border-white/10"
              style={{
                padding: '6px 12px 6px 12px',
                justifyContent: 'space-between',
                alignItems: 'center',
                alignSelf: 'stretch',
              }}
            >
              <div className="text-sm text-white/70">
                {currentStep + 1}/{steps.length}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handlePrev}
                  disabled={isFirstStep()}
                  className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                    isFirstStep()
                      ? "border-primary-200/50 text-primary-200/50 cursor-not-allowed"
                      : "border-primary-200 text-primary-200 hover:bg-primary-200/10"
                  }`}
                  style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
                >
                  ←
                </button>
                <button
                  onClick={handleNext}
                  className="w-6 h-6 flex items-center justify-center rounded-full border border-primary-200 text-primary-200 hover:bg-primary-200/10"
                  style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Arrow image placement - displayed below card */}
          <img
            src="/step2_arrow.png" 
            alt="Arrow pointing to toolbar" 
            className="absolute bottom-[-100px] left-[calc(50%-200px)] translate-x-[-50%] z-[60] w-[150px] h-auto pointer-events-none arrow-animation"
          />
        </div>

        <style jsx global>{`
          .tour-highlight {
            position: relative;
            z-index: 999 !important;
            box-shadow: 0 0 15px 8px rgba(0, 135, 246, 0.6) !important;
            border-radius: 8px !important;
            animation: ${getPulseAnimation()} 2s infinite;
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
      </div>,
      document.body
    );
  } else if (currentStep === 2) {
    // Special layout for step 3
    return createPortal(
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

        {/* Step 3 special card */}
        <div
          className="rounded-2xl shadow-lg pointer-events-auto relative overflow-hidden flex flex-col tour-card-step3"
          style={{
            width: '483px',
            height: '423px',
            border: '1px solid rgba(241, 241, 241, 0.20)',
            background: 'linear-gradient(169deg, rgba(26, 42, 70, 0.60) 0%, rgba(23, 21, 42, 0.60) 97.46%)',
            boxShadow: '0px 34px 84px 0px rgba(0, 0, 0, 0.25)',
            fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif',
          }}
        >
          {/* Image area */}
          <div 
            className="w-full h-[280px] flex items-center justify-center"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 50, 80, 1), rgba(20, 25, 40, 1))'
            }}
          >
            <img src="/03.gif" alt="Step 3 Tutorial" className="w-full h-full object-cover" />
          </div>

          {/* Text area */}
          <div className="flex flex-col justify-start p-4 gap-1 flex-grow">
            <h3 className="text-white/80 font-semibold" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif', marginBottom: '0' }}>
              {steps[currentStep].title}
            </h3>
            <div className="text-white/40" style={{ fontSize: '12px', marginTop: '0' }} dangerouslySetInnerHTML={{ __html: steps[currentStep].content }} />
          </div>

          {/* Footer: Page navigation */}
          <div 
            className="flex justify-between items-center border-t border-white/10"
            style={{
              padding: '6px 12px 6px 12px',
              justifyContent: 'space-between',
              alignItems: 'center',
              alignSelf: 'stretch',
            }}
          >
            <div className="text-sm text-white/70">
              {currentStep + 1}/{steps.length}
            </div>
            <div className="flex gap-1">
              <button
                onClick={handlePrev}
                disabled={isFirstStep()}
                className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                  isFirstStep()
                    ? "border-primary-200/50 text-primary-200/50 cursor-not-allowed"
                    : "border-primary-200 text-primary-200 hover:bg-primary-200/10"
                }`}
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="w-6 h-6 flex items-center justify-center rounded-full border border-primary-200 text-primary-200 hover:bg-primary-200/10"
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
              >
                →
              </button>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .tour-highlight {
            position: relative;
            z-index: 999 !important;
            box-shadow: 0 0 15px 8px rgba(0, 135, 246, 0.6) !important;
            border-radius: 8px !important;
            animation: ${getPulseAnimation()} 2s infinite;
            filter: drop-shadow(0 0 30px rgba(0, 135, 246, 0.6)) !important;
            outline: 2px solid rgba(0, 135, 246, 0.8) !important;
          }
          
          .tour-card-step1, .tour-card-step3 {
            filter: drop-shadow(0 0 15px rgba(0, 135, 246, 0.3));
            animation: card-glow 2s infinite;
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
      </div>,
      document.body
    );
  } else if (currentStep === 3) {
    // Special layout for step 4 (same style as step 2)
    return createPortal(
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

        {/* Step 4 special card */}
        <div
          className="rounded-2xl shadow-lg pointer-events-auto relative overflow-hidden flex flex-col tour-card-step3"
          style={{
            width: '264px',
            height: '437px',
            border: '1px solid rgba(241, 241, 241, 0.20)',
            background: 'linear-gradient(169deg, rgba(26, 42, 70, 0.60) 0%, rgba(23, 21, 42, 0.60) 97.46%)',
            boxShadow: '0px 34px 84px 0px rgba(0, 0, 0, 0.25)',
            fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif',
          }}
        >
          {/* Image area */}
          <div 
            className="w-full h-[280px] flex items-center justify-center"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 50, 80, 1), rgba(20, 25, 40, 1))'
            }}
          >
            <img src="/04.gif" alt="Step 4 Tutorial" className="w-full h-full object-cover" />
          </div>

          {/* Text area */}
          <div className="flex flex-col justify-center p-4 gap-1 flex-grow">
            <h3 className="text-white/80 font-semibold mb-1" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif' }}>
              {steps[currentStep].title}
            </h3>
            <div className="text-white/40 my-2" style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: steps[currentStep].content }} />
          </div>

          {/* Footer: Page navigation */}
          <div 
            className="flex justify-between items-center border-t border-white/10"
            style={{
              padding: '6px 12px 6px 12px',
              justifyContent: 'space-between',
              alignItems: 'center',
              alignSelf: 'stretch',
            }}
          >
            <div className="text-sm text-white/70">
              {currentStep + 1}/{steps.length}
            </div>
            <div className="flex gap-1">
              <button
                onClick={handlePrev}
                disabled={isFirstStep()}
                className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                  isFirstStep()
                    ? "border-primary-200/50 text-primary-200/50 cursor-not-allowed"
                    : "border-primary-200 text-primary-200 hover:bg-primary-200/10"
                }`}
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="w-6 h-6 flex items-center justify-center rounded-full border border-primary-200 text-primary-200 hover:bg-primary-200/10"
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
              >
                →
              </button>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .tour-highlight {
            position: relative;
            z-index: 999 !important;
            box-shadow: 0 0 15px 8px rgba(0, 135, 246, 0.6) !important;
            border-radius: 8px !important;
            animation: ${getPulseAnimation()} 2s infinite;
            filter: drop-shadow(0 0 30px rgba(0, 135, 246, 0.6)) !important;
            outline: 2px solid rgba(0, 135, 246, 0.8) !important;
          }
          
          .tour-card-step1, .tour-card-step3 {
            filter: drop-shadow(0 0 15px rgba(0, 135, 246, 0.3));
            animation: card-glow 2s infinite;
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
      </div>,
      document.body
    );
  } else if (currentStep === 4) {
    // Special layout for step 5
    return createPortal(
      <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-end">
        {/* Overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

        {/* Group card and arrow - positioned at top right */}
        <div className="relative pointer-events-none mt-[140px] mr-8">
          {/* Step 5 special card */}
          <div
            className="rounded-2xl shadow-lg pointer-events-auto relative overflow-hidden flex flex-col"
            style={{
              width: '483px',
              height: '423px',
              border: '1px solid rgba(241, 241, 241, 0.20)',
              background: 'linear-gradient(169deg, rgba(26, 42, 70, 0.60) 0%, rgba(23, 21, 42, 0.60) 97.46%)',
              boxShadow: '0px 34px 84px 0px rgba(0, 0, 0, 0.25)',
              fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif',
            }}
          >
            {/* Image area */}
            <div 
              className="w-full h-[280px] flex items-center justify-center"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 50, 80, 1), rgba(20, 25, 40, 1))'
              }}
            >
              {/* 画像が入る場所（仮） */}
            </div>

            {/* Text area */}
            <div className="flex flex-col justify-center p-4 gap-1 flex-grow">
              <h3 className="text-white/80 font-semibold mb-1" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif' }}>
                {steps[currentStep].title}
              </h3>
              <div className="text-white/40 my-2" style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: steps[currentStep].content }} />
            </div>

            {/* Footer: Page navigation */}
            <div 
              className="flex justify-between items-center border-t border-white/10"
              style={{
                padding: '6px 12px 6px 12px',
                justifyContent: 'space-between',
                alignItems: 'center',
                alignSelf: 'stretch',
              }}
            >
              <div className="text-sm text-white/70">
                {currentStep + 1}/{steps.length}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handlePrev}
                  disabled={isFirstStep()}
                  className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                    isFirstStep()
                      ? "border-primary-200/50 text-primary-200/50 cursor-not-allowed"
                      : "border-primary-200 text-primary-200 hover:bg-primary-200/10"
                  }`}
                  style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
                >
                  ←
                </button>
                <button
                  onClick={handleNext}
                  className="w-6 h-6 flex items-center justify-center rounded-full border border-primary-200 text-primary-200 hover:bg-primary-200/10"
                  style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* Arrow image placement */}
          <img 
            src="/step5_arrow.png" 
            alt="Arrow pointing to tabs" 
            className="absolute top-[-110px] left-[calc(50%-190px)] z-[60] w-[150px] h-auto pointer-events-none arrow-animation"
          />
        </div>

        <style jsx global>{`
          .tour-highlight {
            position: relative;
            z-index: 999 !important;
            box-shadow: 0 0 15px 8px rgba(0, 135, 246, 0.6) !important;
            border-radius: 8px !important;
            animation: ${getPulseAnimation()} 2s infinite;
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
      </div>,
      document.body
    );
  } else if (currentStep === 5) {
    // Special layout for step 6 (positioned at bottom left)
    return createPortal(
      <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-start">
        {/* Overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

        {/* Step 6 special card - positioned at bottom left */}
        <div
          className="rounded-2xl shadow-lg pointer-events-auto relative overflow-hidden flex flex-col ml-8 mb-8 mt-auto"
          style={{
            width: '264px',
            height: '437px',
            border: '1px solid rgba(241, 241, 241, 0.20)',
            background: 'linear-gradient(169deg, rgba(26, 42, 70, 0.60) 0%, rgba(23, 21, 42, 0.60) 97.46%)',
            boxShadow: '0px 34px 84px 0px rgba(0, 0, 0, 0.25)',
            fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif',
          }}
        >
          {/* Image area */}
          <div 
            className="w-full h-[280px] flex items-center justify-center"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 50, 80, 1), rgba(20, 25, 40, 1))'
            }}
          >
            {/* 画像が入る場所（仮） */}
          </div>

          {/* Text area */}
          <div className="flex flex-col justify-center p-4 gap-1 flex-grow">
            <h3 className="text-white/80 font-semibold mb-1" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif' }}>
              {steps[currentStep].title}
            </h3>
            <div className="text-white/40 my-2" style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: steps[currentStep].content }} />
          </div>

          {/* Footer: Page navigation */}
          <div 
            className="flex justify-between items-center border-t border-white/10"
            style={{
              padding: '6px 12px 6px 12px',
              justifyContent: 'space-between',
              alignItems: 'center',
              alignSelf: 'stretch',
            }}
          >
            <div className="text-sm text-white/70">
              {currentStep + 1}/{steps.length}
            </div>
            <div className="flex gap-1">
              <button
                onClick={handlePrev}
                disabled={isFirstStep()}
                className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                  isFirstStep()
                    ? "border-primary-200/50 text-primary-200/50 cursor-not-allowed"
                    : "border-primary-200 text-primary-200 hover:bg-primary-200/10"
                }`}
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="px-3 h-6 flex items-center justify-center rounded-full border border-primary-200 text-primary-200 hover:bg-primary-200/10"
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
              >
                Finish
              </button>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .tour-highlight {
            position: relative;
            z-index: 999 !important;
            box-shadow: 0 0 15px 8px rgba(0, 135, 246, 0.6) !important;
            border-radius: 8px !important;
            animation: ${getPulseAnimation()} 2s infinite;
            filter: drop-shadow(0 0 30px rgba(0, 135, 246, 0.6)) !important;
            outline: 2px solid rgba(0, 135, 246, 0.8) !important;
          }
          
          .tour-card-step1, .tour-card-step3 {
            filter: drop-shadow(0 0 15px rgba(0, 135, 246, 0.3));
            animation: card-glow 2s infinite;
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
      </div>,
      document.body
    );
  }

  // Default layout (for step 1, etc.)
  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

      {/* Tour card */}
      <div
        className="rounded-2xl shadow-lg pointer-events-auto relative overflow-hidden flex flex-col tour-card-step1"
        style={{
          width: '792px',
          height: '241px',
          border: '1px solid rgba(241, 241, 241, 0.20)',
          background: 'linear-gradient(169deg, rgba(26, 42, 70, 0.60) 0%, rgba(23, 21, 42, 0.60) 97.46%)',
          boxShadow: '0px 34px 84px 0px rgba(0, 0, 0, 0.25)',
          fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif',
        }}
      >
        {/* Card content */}
        <div className="relative z-10 h-full w-full flex flex-col justify-between">
          {/* 3-column main content */}
          <div className="grid grid-cols-3 h-full">
            {/* Left column: Navigation */}
            <div className="flex flex-col justify-center p-4 gap-1 border-r border-white/10">
              <h3 className="text-white/80 font-semibold mb-1 text-center" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif' }}>Navigation</h3>
              <p className="text-white/40 my-2 text-center" style={{ fontSize: '12px' }}>
                Drag to move canvas<br />
                ⌘(Ctrl) + scroll to<br />
                zoom in/out
              </p>
              <div className="flex w-full mt-1 justify-center">
                <button 
                  className="text-white/85 text-xs rounded-full flex justify-center items-center gap-1"
                  style={{
                    padding: '3px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(245, 245, 245, 0.10)',
                    background: 'rgba(245, 245, 245, 0.10)',
                  }}
                >
                  ⌘ + scroll
                </button>
              </div>
            </div>

            {/* Middle column: Node Controls */}
            <div className="flex flex-col justify-center p-4 gap-1 border-r border-white/10">
              <h3 className="text-white/80 font-semibold mb-1 text-center" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif' }}>Node Controls</h3>
              <p className="text-white/40 my-2 text-center" style={{ fontSize: '12px' }}>
                Double-tap nodes to open<br />
                setting Drag & drop<br />
                to connect
              </p>
              <div className="flex w-full mt-1 justify-center">
                <button 
                  className="text-white/85 text-xs rounded-full flex justify-center items-center gap-1"
                  style={{
                    padding: '3px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(245, 245, 245, 0.10)',
                    background: 'rgba(245, 245, 245, 0.10)',
                  }}
                >
                  Double-tap
                </button>
              </div>
            </div>

            {/* Right column: Run Commands */}
            <div className="flex flex-col justify-center p-4 gap-1">
              <h3 className="text-white/80 font-semibold mb-1 text-center" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif' }}>Run Commands</h3>
              <p className="text-white/40 my-2 text-center" style={{ fontSize: '12px' }}>
                ⌘ + Enter to Run<br />
                ⌘ + Shift + Enter to<br />
                run entire workflows
              </p>
              <div className="flex w-full mt-1 justify-center">
                <button 
                  className="text-white/85 text-xs rounded-full flex justify-center items-center gap-1"
                  style={{
                    padding: '3px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(245, 245, 245, 0.10)',
                    background: 'rgba(245, 245, 245, 0.10)',
                  }}
                >
                  ⌘ + ⇧ + ↵
                </button>
              </div>
            </div>
          </div>

          {/* Footer: Page navigation */}
          <div 
            className="flex justify-between items-center border-t border-white/10"
            style={{
              padding: '6px 12px 6px 12px',
              justifyContent: 'space-between',
              alignItems: 'center',
              alignSelf: 'stretch',
            }}
          >
            <div className="text-sm text-white/70">
              {currentStep + 1}/{steps.length}
            </div>
            <div className="flex gap-1">
              <button
                onClick={handlePrev}
                disabled={isFirstStep()}
                className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                  isFirstStep()
                    ? "border-primary-200/50 text-primary-200/50 cursor-not-allowed"
                    : "border-primary-200 text-primary-200 hover:bg-primary-200/10"
                }`}
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="w-6 h-6 flex items-center justify-center rounded-full border border-primary-200 text-primary-200 hover:bg-primary-200/10"
                style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 999 !important;
          box-shadow: 0 0 15px 8px rgba(0, 135, 246, 0.6) !important;
          border-radius: 8px !important;
          animation: ${getPulseAnimation()} 2s infinite;
          filter: drop-shadow(0 0 30px rgba(0, 135, 246, 0.6)) !important;
          outline: 2px solid rgba(0, 135, 246, 0.8) !important;
        }
        
        .tour-card-step1, .tour-card-step3 {
          filter: drop-shadow(0 0 15px rgba(0, 135, 246, 0.3));
          animation: card-glow 2s infinite;
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
    </div>,
    document.body
  );
}; 