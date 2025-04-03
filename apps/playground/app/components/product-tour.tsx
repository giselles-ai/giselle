"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type TourStep = {
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
};

interface ProductTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
}

export const ProductTour = ({ steps, isOpen, onClose }: ProductTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    const positionTooltip = () => {
      const currentTarget = document.querySelector(steps[currentStep].target);
      if (!currentTarget) return;

      const rect = currentTarget.getBoundingClientRect();
      const placement = steps[currentStep].placement || "bottom";

      // Add highlight to current target
      currentTarget.classList.add("tour-highlight");

      let top = 0;
      let left = 0;

      switch (placement) {
        case "top":
          top = rect.top - 10 - 120; // 120px for tooltip height + padding
          left = rect.left + rect.width / 2 - 150; // 150px for half tooltip width
          break;
        case "bottom":
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2 - 150;
          break;
        case "left":
          top = rect.top + rect.height / 2 - 60;
          left = rect.left - 10 - 300; // 300px for tooltip width
          break;
        case "right":
          top = rect.top + rect.height / 2 - 60;
          left = rect.right + 10;
          break;
      }

      setTooltipPosition({ top, left });
    };

    // Position tooltip and add highlight
    positionTooltip();

    // Clean up function to remove highlight
    return () => {
      const currentTarget = document.querySelector(steps[currentStep].target);
      if (currentTarget) {
        currentTarget.classList.remove("tour-highlight");
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

  if (!mounted || !isOpen || steps.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-auto" onClick={handleClose} />

      {/* Tooltip */}
      <div
        className="absolute bg-red-600 text-white rounded-lg shadow-lg p-4 w-[300px] pointer-events-auto"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-white/70">
            Step {currentStep + 1} of {steps.length}
          </span>
          <button
            onClick={handleClose}
            className="text-white hover:text-white/80"
          >
            ✕
          </button>
        </div>
        <h3 className="text-lg font-bold mb-2">{steps[currentStep].title}</h3>
        <p className="text-white/80 mb-4">{steps[currentStep].content}</p>
        <div className="flex justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded ${
              currentStep === 0
                ? "bg-red-700 text-white/50 cursor-not-allowed"
                : "bg-red-700 text-white hover:bg-red-800"
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-white text-red-600 font-medium rounded hover:bg-white/90"
          >
            {currentStep === steps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 51;
          box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.5);
          border-radius: 4px;
        }
      `}</style>
    </div>,
    document.body
  );
};
