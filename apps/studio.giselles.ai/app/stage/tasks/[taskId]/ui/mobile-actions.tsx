"use client";

import type { Generation } from "@giselles-ai/protocol";
import { CheckCircle, Copy, Download } from "lucide-react";
import { useState } from "react";
import { getAssistantTextFromGeneration } from "../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-text";

interface MobileActionsProps {
	generation: Generation;
}

export function MobileActions({ generation }: MobileActionsProps) {
	const [copyFeedback, setCopyFeedback] = useState(false);

	const handleCopyToClipboard = async () => {
		try {
			const textContent = getAssistantTextFromGeneration(generation);

			if (textContent) {
				await navigator.clipboard.writeText(textContent);
				setCopyFeedback(true);
				setTimeout(() => setCopyFeedback(false), 2000);
			}
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
		<div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border">
			<button
				type="button"
				className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition-colors group touch-manipulation"
				title={copyFeedback ? "Copied!" : "Copy content"}
				onClick={handleCopyToClipboard}
			>
				{copyFeedback ? (
					<CheckCircle className="size-4 text-green-400" />
				) : (
					<Copy className="size-4 text-white/70 group-hover:text-white transition-colors" />
				)}
				<span className="text-white/70 group-hover:text-white transition-colors">
					{copyFeedback ? "Copied!" : "Copy"}
				</span>
			</button>
			<button
				type="button"
				className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 rounded-lg transition-colors group touch-manipulation"
				title="Download content"
				onClick={handleDownload}
			>
				<Download className="size-4 text-white/70 group-hover:text-white transition-colors" />
				<span className="text-white/70 group-hover:text-white transition-colors">
					Download
				</span>
			</button>
		</div>
	);
}
