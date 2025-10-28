"use client";

import clsx from "clsx/lite";

export function GenerateCtaButton({
	isGenerating,
	isEmpty,
	onClick,
	className,
	idleLabel = "Generate with the Current Prompt",
	emptyLabel = "Start Writing Your Prompt",
	showShortcutHint = true,
}: {
	isGenerating: boolean;
	isEmpty: boolean;
	onClick: () => void;
	className?: string;
	idleLabel?: string;
	emptyLabel?: string;
	showShortcutHint?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={!isGenerating && isEmpty}
			className={clsx(
				"w-full flex items-center justify-center px-[24px] py-[12px] text-white rounded-[9999px] border transition-all hover:translate-y-[-1px] cursor-pointer font-sans font-[500] text-[14px] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
				isEmpty
					? "bg-[#141519] border-border/15 hover:bg-[#1e1f26] hover:border-border/25"
					: "bg-primary-900 border-primary-900/30 hover:bg-primary-800",
				className,
			)}
		>
			<span
				className={clsx("mr-[8px] generate-star", isGenerating && "generating")}
			>
				✦
			</span>
			{isGenerating ? "Stop" : isEmpty ? emptyLabel : idleLabel}
			{!isGenerating && !isEmpty && showShortcutHint && (
				<span className="ml-[8px] flex items-center gap-[2px] text-[11px] text-white/60">
					<kbd className="px-[4px] py-[1px] bg-white/20 rounded-[4px]">⌘</kbd>
					<kbd className="px-[4px] py-[1px] bg-white/20 rounded-[4px]">↵</kbd>
				</span>
			)}
			<style jsx>{`
				.generate-star { display: inline-block; }
				.generate-star.generating { animation: continuousRotate 1s linear infinite; }
				button:hover .generate-star:not(.generating) { animation: rotateStar 0.7s ease-in-out; }
				@keyframes rotateStar {
					0% { transform: rotate(0deg) scale(1); }
					50% { transform: rotate(180deg) scale(1.5); }
					100% { transform: rotate(360deg) scale(1); }
				}
				@keyframes continuousRotate {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</button>
	);
}
