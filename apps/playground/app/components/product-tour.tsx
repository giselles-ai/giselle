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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    // ハイライト対象の要素を取得して強調表示
    const currentTarget = document.querySelector(steps[currentStep].target);
    if (currentTarget) {
      currentTarget.classList.add("tour-highlight");
    }

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
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

      {/* ツアーカード */}
      <div
        className="rounded-2xl shadow-lg pointer-events-auto relative overflow-hidden flex flex-col"
        style={{
          width: '792px',
          height: '241px',
          border: '1px solid rgba(241, 241, 241, 0.20)',
          background: 'linear-gradient(169deg, rgba(26, 42, 70, 0.60) 0%, rgba(23, 21, 42, 0.60) 97.46%)',
          boxShadow: '0px 34px 84px 0px rgba(0, 0, 0, 0.25)',
          fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        }}
      >
        {/* カードコンテンツ */}
        <div className="relative z-10 h-full w-full flex flex-col justify-between">
          {/* 3カラムのメインコンテンツ */}
          <div className="grid grid-cols-3 h-full">
            {/* 左カラム: Navigation */}
            <div className="flex flex-col items-center justify-center p-4 gap-1 border-r border-white/10">
              <h3 className="text-white/80 font-semibold mb-1" style={{ fontSize: '20px', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>Navigation</h3>
              <p className="text-white/40 text-center my-2" style={{ fontSize: '12px' }}>
                Drag to move canvas<br />
                ⌘(Ctrl) + scroll to<br />
                zoom in/out
              </p>
              <div className="flex justify-center w-full mt-1">
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

            {/* 中央カラム: Node Controls */}
            <div className="flex flex-col items-center justify-center p-4 gap-1 border-r border-white/10">
              <h3 className="text-white/80 font-semibold mb-1" style={{ fontSize: '20px', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>Node Controls</h3>
              <p className="text-white/40 text-center my-2" style={{ fontSize: '12px' }}>
                Double-tap nodes to open<br />
                setting Drag & drop<br />
                to connect
              </p>
              <div className="flex justify-center w-full mt-1">
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

            {/* 右カラム: Run Commands */}
            <div className="flex flex-col items-center justify-center p-4 gap-1">
              <h3 className="text-white/80 font-semibold mb-1" style={{ fontSize: '20px', fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>Run Commands</h3>
              <p className="text-white/40 text-center my-2" style={{ fontSize: '12px' }}>
                ⌘ + Enter to Run<br />
                ⌘ + Shift + Enter to<br />
                run entire workflows
              </p>
              <div className="flex justify-center w-full mt-1">
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

          {/* フッター: ページナビゲーション */}
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
                disabled={currentStep === 0}
                className={`w-6 h-6 flex items-center justify-center rounded-full border ${
                  currentStep === 0
                    ? "border-primary-200/50 text-primary-200/50 cursor-not-allowed"
                    : "border-primary-200 text-primary-200 hover:bg-primary-200/10"
                }`}
              >
                ←
              </button>
              <button
                onClick={handleNext}
                className="w-6 h-6 flex items-center justify-center rounded-full border border-primary-200 text-primary-200 hover:bg-primary-200/10"
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
          z-index: 51;
          box-shadow: 0 0 0 3px rgb(76, 89, 175), 0 0 15px rgba(76, 89, 175, 0.7);
          border-radius: 4px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 3px rgb(76, 89, 175), 0 0 15px rgba(76, 89, 175, 0.7);
          }
          50% {
            box-shadow: 0 0 0 3px rgb(76, 89, 175), 0 0 20px rgba(76, 89, 175, 0.9);
          }
          100% {
            box-shadow: 0 0 0 3px rgb(76, 89, 175), 0 0 15px rgba(76, 89, 175, 0.7);
          }
        }
      `}</style>
    </div>,
    document.body
  );
};
