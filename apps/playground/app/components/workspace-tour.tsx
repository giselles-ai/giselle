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

  // ブラーの値を取得する関数（ステップ5のみ10px、他は20px）
  const getBlurSize = (): string => {
    return currentStep === 4 ? "10px" : "20px";
  };

  // パルスアニメーション名を取得する関数
  const getPulseAnimation = (): string => {
    return currentStep === 4 ? "pulseStep5" : "pulse";
  };

  // ハイライト機能を有効化
  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    // すべてのステップのターゲット要素をチェック
    console.log("現在のステップ:", currentStep + 1);
    console.log("すべてのターゲット:");
    steps.forEach((step, idx) => {
      const target = step.target ? document.querySelector(step.target) : null;
      console.log(`ステップ${idx + 1}:`, {
        target: step.target,
        found: target ? "✅ 要素あり" : "❌ 要素なし"
      });
    });

    // ハイライト対象の要素を取得して強調表示
    // undefined エラーを防ぐためにチェックを追加
    if (!steps[currentStep]) return;
    
    const currentStepTarget = steps[currentStep].target;
    const currentTarget = currentStepTarget ? document.querySelector(currentStepTarget) : null;
    
    console.log(`[ツアーハイライト] ステップ${currentStep + 1}:`, {
      target: currentStepTarget,
      foundElement: currentTarget ? "✅ 要素あり" : "❌ 要素なし",
      element: currentTarget
    });
    
    if (currentTarget) {
      currentTarget.classList.add("tour-highlight");
      console.log("ハイライト適用: ", currentTarget);
      
      // 強制的にスタイルを適用（ステップ5だけblur 10px、他は20px）
      const blurSize = getBlurSize();
      (currentTarget as HTMLElement).style.setProperty("box-shadow", "0 0 10px 5px rgba(0, 135, 246, 0.5)", "important");
      (currentTarget as HTMLElement).style.removeProperty("outline");
      (currentTarget as HTMLElement).style.setProperty("z-index", "9999", "important");
      (currentTarget as HTMLElement).style.setProperty("position", "relative", "important");
      (currentTarget as HTMLElement).style.setProperty("filter", `drop-shadow(0 0 ${blurSize} rgba(0, 135, 246, 0.5))`, "important");
    } else if (currentStepTarget) {
      console.error("ターゲット要素が見つかりません:", currentStepTarget);
      
      // 要素を見つけるための代替セレクタを試す
      const alternativeSelectors = [".View-selector", "[role='tablist']", ".header-tabs", ".view-switcher"];
      alternativeSelectors.forEach(selector => {
        const el = document.querySelector(selector);
        console.log(`代替セレクタ ${selector}:`, el ? "✅ 要素あり" : "❌ 要素なし");
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

  // ボタンの無効状態を判定する関数（TypeScript エラーを回避）
  const isFirstStep = (): boolean => {
    return currentStep === 0;
  };

  if (!mounted || !isOpen || steps.length === 0) return null;

  // 現在のステップに応じて異なるレイアウトを表示
  if (currentStep === 1) {
    // ステップ2の特別なレイアウト
    return createPortal(
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

        {/* ステップ2専用カード */}
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
          {/* 画像エリア */}
          <div 
            className="w-full h-[280px]"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 50, 80, 1), rgba(20, 25, 40, 1))'
            }}
          >
            {/* 画像が入る場所 */}
          </div>

          {/* テキストエリア */}
          <div className="flex flex-col justify-center p-4 gap-1 flex-grow">
            <h3 className="text-white/80 font-semibold mb-1" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif' }}>
              {steps[currentStep].title}
            </h3>
            <div className="text-white/40 my-2" style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: steps[currentStep].content }} />
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
            box-shadow: 0 0 10px 5px rgba(0, 135, 246, 0.5) !important;
            border-radius: 4px;
            animation: ${getPulseAnimation()} 2s infinite;
            filter: drop-shadow(0 0 ${getBlurSize()} rgba(0, 135, 246, 0.5)) !important;
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
  } else if (currentStep === 2) {
    // ステップ3の特別なレイアウト
    return createPortal(
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

        {/* ステップ3専用カード */}
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
          {/* 画像エリア */}
          <div 
            className="w-full h-[280px]"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 50, 80, 1), rgba(20, 25, 40, 1))'
            }}
          >
            {/* 画像が入る場所 */}
          </div>

          {/* テキストエリア */}
          <div className="flex flex-col justify-start p-4 gap-1 flex-grow">
            <h3 className="text-white/80 font-semibold" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif', marginBottom: '0' }}>
              {steps[currentStep].title}
            </h3>
            <div className="text-white/40" style={{ fontSize: '12px', marginTop: '0' }} dangerouslySetInnerHTML={{ __html: steps[currentStep].content }} />
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
            box-shadow: 0 0 10px 5px rgba(0, 135, 246, 0.5) !important;
            border-radius: 4px;
            animation: ${getPulseAnimation()} 2s infinite;
            filter: drop-shadow(0 0 ${getBlurSize()} rgba(0, 135, 246, 0.5)) !important;
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
    // ステップ4の特別なレイアウト (ステップ2のスタイルと同じ)
    return createPortal(
      <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
        {/* Overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

        {/* ステップ4専用カード */}
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
          {/* 画像エリア */}
          <div 
            className="w-full h-[280px]"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 50, 80, 1), rgba(20, 25, 40, 1))'
            }}
          >
            {/* 画像が入る場所 */}
          </div>

          {/* テキストエリア */}
          <div className="flex flex-col justify-center p-4 gap-1 flex-grow">
            <h3 className="text-white/80 font-semibold mb-1" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif' }}>
              {steps[currentStep].title}
            </h3>
            <div className="text-white/40 my-2" style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: steps[currentStep].content }} />
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
            box-shadow: 0 0 10px 5px rgba(0, 135, 246, 0.5) !important;
            border-radius: 4px;
            animation: ${getPulseAnimation()} 2s infinite;
            filter: drop-shadow(0 0 ${getBlurSize()} rgba(0, 135, 246, 0.5)) !important;
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
    // ステップ5の特別なレイアウト (ステップ3のスタイルと同じ)
    return createPortal(
      <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-end">
        {/* Overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

        {/* ステップ5専用カード - 右上に配置 - 上部余白追加 */}
        <div
          className="rounded-2xl shadow-lg pointer-events-auto relative overflow-hidden flex flex-col mt-[100px] mr-8"
          style={{
            width: '483px',
            height: '423px',
            border: '1px solid rgba(241, 241, 241, 0.20)',
            background: 'linear-gradient(169deg, rgba(26, 42, 70, 0.60) 0%, rgba(23, 21, 42, 0.60) 97.46%)',
            boxShadow: '0px 34px 84px 0px rgba(0, 0, 0, 0.25)',
            fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif',
          }}
        >
          {/* 画像エリア */}
          <div 
            className="w-full h-[280px]"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 50, 80, 1), rgba(20, 25, 40, 1))'
            }}
          >
            {/* 画像が入る場所 */}
          </div>

          {/* テキストエリア */}
          <div className="flex flex-col justify-center p-4 gap-1 flex-grow">
            <h3 className="text-white/80 font-semibold mb-1" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif' }}>
              {steps[currentStep].title}
            </h3>
            <div className="text-white/40 my-2" style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: steps[currentStep].content }} />
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
            box-shadow: 0 0 10px 5px rgba(0, 135, 246, 0.5) !important;
            border-radius: 4px;
            animation: ${getPulseAnimation()} 2s infinite;
            filter: drop-shadow(0 0 ${getBlurSize()} rgba(0, 135, 246, 0.5)) !important;
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
  } else if (currentStep === 5) {
    // ステップ6の特別なレイアウト (左下に配置)
    return createPortal(
      <div className="fixed inset-0 z-50 pointer-events-none flex items-start justify-start">
        {/* Overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

        {/* ステップ6専用カード - 左下に配置 */}
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
          {/* 画像エリア */}
          <div 
            className="w-full h-[280px]"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30, 50, 80, 1), rgba(20, 25, 40, 1))'
            }}
          >
            {/* 画像が入る場所 */}
          </div>

          {/* テキストエリア */}
          <div className="flex flex-col justify-center p-4 gap-1 flex-grow">
            <h3 className="text-white/80 font-semibold mb-1" style={{ fontSize: '16px', fontFamily: 'var(--font-hubot-sans), system-ui, sans-serif' }}>
              {steps[currentStep].title}
            </h3>
            <div className="text-white/40 my-2" style={{ fontSize: '12px' }} dangerouslySetInnerHTML={{ __html: steps[currentStep].content }} />
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
            box-shadow: 0 0 10px 5px rgba(0, 135, 246, 0.5) !important;
            border-radius: 4px;
            animation: ${getPulseAnimation()} 2s infinite;
            filter: drop-shadow(0 0 ${getBlurSize()} rgba(0, 135, 246, 0.5)) !important;
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

  // デフォルトのレイアウト（ステップ1など）
  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={handleClose} />

      {/* ツアーカード */}
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
        {/* カードコンテンツ */}
        <div className="relative z-10 h-full w-full flex flex-col justify-between">
          {/* 3カラムのメインコンテンツ */}
          <div className="grid grid-cols-3 h-full">
            {/* 左カラム: Navigation */}
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

            {/* 中央カラム: Node Controls */}
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

            {/* 右カラム: Run Commands */}
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
          box-shadow: 0 0 10px 5px rgba(0, 135, 246, 0.5) !important;
          border-radius: 4px;
          animation: ${getPulseAnimation()} 2s infinite;
          filter: drop-shadow(0 0 ${getBlurSize()} rgba(0, 135, 246, 0.5)) !important;
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