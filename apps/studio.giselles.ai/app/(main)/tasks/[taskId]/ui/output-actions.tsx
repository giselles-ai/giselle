"use client";

import type { Generation } from "@giselles-ai/protocol";
import { CheckCircle, Copy, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { getAssistantTextFromGeneration } from "../../../../../../../internal-packages/workflow-designer-ui/src/ui/generation-text";

export function OutputActions({ generation }: { generation: Generation }) {
	const [copyFeedback, setCopyFeedback] = useState(false);

	useEffect(() => {
		if (!copyFeedback) {
			return;
		}
		const timer = setTimeout(() => setCopyFeedback(false), 2000);
		return () => clearTimeout(timer);
	}, [copyFeedback]);

	const handleCopyToClipboard = async () => {
		try {
			const textContent = getAssistantTextFromGeneration(generation);
			if (!textContent) {
				return;
			}
			await navigator.clipboard.writeText(textContent);
			setCopyFeedback(true);
		} catch (error) {
			console.error("Failed to copy to clipboard:", error);
		}
	};

	const handleDownload = () => {
		try {
			const textContent = getAssistantTextFromGeneration(generation);
			if (!textContent) {
				return;
			}
			const blob = new Blob([textContent], { type: "text/plain" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `generation-${generation.id}.txt`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Failed to download content:", error);
		}
	};

	return (
		<div className="flex items-center">
			<button
				type="button"
				className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
				title={copyFeedback ? "Copied!" : "Copy content"}
				onClick={handleCopyToClipboard}
			>
				{copyFeedback ? (
					<CheckCircle className="size-4 text-green-400" />
				) : (
					<Copy className="size-4 text-text-muted group-hover:text-text transition-colors" />
				)}
			</button>
			<button
				type="button"
				className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
				title="Download content"
				onClick={handleDownload}
			>
				<Download className="size-4 text-text-muted group-hover:text-text transition-colors" />
			</button>
		</div>
	);
}
