"use client";

import type { Generation } from "@giselle-sdk/giselle";
import { CheckCircle, Copy, Download } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

interface StepLayoutProps {
	header: ReactNode;
	children: ReactNode;
	generation: Generation;
}

export function StepLayout({ header, children, generation }: StepLayoutProps) {
	const [copyFeedback, setCopyFeedback] = useState(false);

	const handleCopyToClipboard = async () => {
		try {
			// Get the text content from the main content area
			const mainContent = document.querySelector('main [class*="max-w-"]');
			if (mainContent) {
				const textContent = mainContent.textContent || "";
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
			// Extract text content for download
			let textContent = "";

			if ("messages" in generation) {
				const assistantMessages =
					generation.messages?.filter((m) => m.role === "assistant") ?? [];

				textContent = assistantMessages
					.map((message) =>
						message.parts
							?.filter((part) => part.type === "text")
							.map((part) => part.text)
							.join("\n"),
					)
					.filter(Boolean)
					.join("\n\n");
			}

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
			<header className="bg-gray-900/80 border-b md:border-b-0 border-border">
				<div className="p-4 md:p-[16px] flex items-center justify-between">
					{header}
					<div className="flex items-center gap-1">
						<button
							type="button"
							className="p-3 md:p-2 hover:bg-white/10 rounded-lg transition-colors group relative touch-manipulation"
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
							className="p-3 md:p-2 hover:bg-white/10 rounded-lg transition-colors group touch-manipulation"
							title="Download content"
							onClick={handleDownload}
						>
							<Download className="size-5 md:size-4 text-white/70 group-hover:text-white transition-colors" />
						</button>
					</div>
				</div>
			</header>
			<main className="p-4 md:px-[32px] md:py-[16px] overflow-y-auto flex-1">
				<div className="max-w-none">{children}</div>
			</main>
		</div>
	);
}
