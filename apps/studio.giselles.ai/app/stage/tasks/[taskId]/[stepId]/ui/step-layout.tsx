"use client";

import type { Generation } from "@giselles-ai/protocol";
import { CheckCircle, Copy, Download } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { getAssistantTextFromGeneration } from "../../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-text";

interface StepLayoutProps {
	header: ReactNode;
	children: ReactNode;
	generation: Generation;
}

export function StepLayout({ header, children, generation }: StepLayoutProps) {
	const [copyFeedback, setCopyFeedback] = useState(false);

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
			<main className="p-4 md:px-[24px] md:py-[16px] overflow-y-auto flex-1">
				<div className="max-w-none">{children}</div>
			</main>
		</div>
	);
}
