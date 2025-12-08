"use client";

import type { Generation } from "@giselles-ai/protocol";
import { CheckCircle, Copy, Download } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { getAssistantTextFromGeneration } from "../../../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-text";

interface StepLayoutProps {
	header: ReactNode;
	children: ReactNode;
	generation: Generation;
}

export function StepLayout({ header, children, generation }: StepLayoutProps) {
	const [copyFeedback, setCopyFeedback] = useState(false);
	const [isScrollable, setIsScrollable] = useState(false);
	const [isAtTop, setIsAtTop] = useState(true);
	const [isAtBottom, setIsAtBottom] = useState(false);
	const contentRef = useRef<HTMLElement | null>(null);

	const handleCopyToClipboard = async () => {
		try {
			const textContent = getAssistantTextFromGeneration(generation);
			if (!textContent) {
				return;
			}

			await navigator.clipboard.writeText(textContent);
			setCopyFeedback(true);
			setTimeout(() => setCopyFeedback(false), 2000);
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	};

	const handleDownload = () => {
		try {
			const textContent = getAssistantTextFromGeneration(generation);
			if (textContent) {
				const blob = new Blob([textContent], { type: "text/plain" });
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `generation-${generation.id}.txt`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
		} catch (error) {
			console.error("Failed to download content:", error);
		}
	};

	useEffect(() => {
		const element = contentRef.current;
		if (!element) {
			return;
		}

		const updateScrollState = () => {
			const maxScrollTop = element.scrollHeight - element.clientHeight;
			setIsScrollable(maxScrollTop > 1);
			setIsAtTop(element.scrollTop <= 0);
			setIsAtBottom(element.scrollTop >= maxScrollTop - 1);
		};

		updateScrollState();
		element.addEventListener("scroll", updateScrollState);
		window.addEventListener("resize", updateScrollState);

		return () => {
			element.removeEventListener("scroll", updateScrollState);
			window.removeEventListener("resize", updateScrollState);
		};
	}, []);

	return (
		<div className="flex flex-col w-full h-full">
			<header className="border-b md:border-b-0 border-border">
				<div className="px-4 py-[16px] flex items-center justify-between">
					{header}
					<div className="flex items-center gap-1">
						<button
							type="button"
							className="p-3 md:p-[8px] hover:bg-white/10 rounded-lg transition-colors group relative touch-manipulation"
							title={copyFeedback ? "Copied!" : "Copy content"}
							onClick={handleCopyToClipboard}
						>
							{copyFeedback ? (
								<CheckCircle className="size-5 md:size-4 text-green-400" />
							) : (
								<Copy className="size-5 md:size-4 text-white/70 group-hover:text-white transition-colors" />
							)}
						</button>
						<button
							type="button"
							className="p-3 md:p-[8px] hover:bg-white/10 rounded-lg transition-colors group touch-manipulation"
							title="Download content"
							onClick={handleDownload}
						>
							<Download className="size-5 md:size-4 text-white/70 group-hover:text-white transition-colors" />
						</button>
					</div>
				</div>
			</header>
			<div className="relative flex-1 min-h-0">
				<main
					ref={contentRef}
					className="p-4 md:px-[24px] md:py-[16px] overflow-y-auto h-full"
				>
					<div className="max-w-none">{children}</div>
				</main>
				{isScrollable && !isAtTop && (
					<div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[rgba(9,14,22,0.95)] via-[rgba(9,14,22,0.45)] to-[rgba(9,14,22,0)]" />
				)}
				{isScrollable && !isAtBottom && (
					<div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[rgba(9,14,22,0.95)] via-[rgba(9,14,22,0.45)] to-[rgba(9,14,22,0)]" />
				)}
			</div>
		</div>
	);
}
