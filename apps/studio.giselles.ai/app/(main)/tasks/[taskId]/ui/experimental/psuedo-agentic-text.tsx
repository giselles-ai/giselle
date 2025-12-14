"use client";

import clsx from "clsx/lite";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PseudoAgenticTextToken } from "./psuedo-agentic-text-data";
import type { UITask } from "./task-data";

type RevealMode = "chunks" | "dissolve";

function getDissolveDurationMs(text: string) {
	// Keep it snappy, but not “too fast to perceive”.
	// Scale lightly with length to avoid long lines feeling abrupt.
	const length = text.length;
	return Math.min(650, Math.max(260, Math.round((length / 90) * 420)));
}

const shimmerTextClassName =
	"bg-[length:200%_100%] bg-clip-text bg-gradient-to-r from-text-muted/70 via-text-muted/35 to-text-muted/70 text-transparent animate-shimmer";

function renderTokens(
	tokens: PseudoAgenticTextToken[],
	{ shouldShimmerTextTokens }: { shouldShimmerTextTokens: boolean },
) {
	return tokens.map((token, index) => {
		if (token.type === "stepItemName") {
			// Mirror the styling used in text editor node references:
			// packages/text-editor/src/react/source-extension-react.tsx
			const contentType = token.contentType;
			const isTextGeneration = contentType === "textGeneration";
			const isImageGeneration = contentType === "imageGeneration";
			const isGithub = contentType === "github";
			const isText = contentType === "text";
			const isFile = contentType === "file";
			const isWebPage = contentType === "webPage";
			const isAction = contentType === "action";
			const isTrigger = contentType === "trigger";
			const isAppEntry = contentType === "appEntry";
			const isQuery = contentType === "query";
			return (
				<span
					key={`${token.type}-${index}-${token.value}`}
					className={clsx(
						"step-item-name",
						"rounded-[8px] px-[4px] py-[2px] border-[1px] transition-colors",
						// Prevent horizontal clipping in overflow-x-hidden containers.
						"max-w-full break-all",
						"border-transparent",
						isTextGeneration &&
							"bg-generation-node-1/20 text-generation-node-1",
						isImageGeneration &&
							"bg-image-generation-node-1/20 text-image-generation-node-1",
						isGithub && "bg-github-node-1/20 text-github-node-1",
						isText && "bg-text-node-1/20 text-text-node-1",
						isFile && "bg-file-node-1/20 text-file-node-1",
						isWebPage && "bg-webPage-node-1/20 text-webPage-node-1",
						isAction && "bg-action-node-1/20 text-action-node-1",
						isTrigger && "bg-trigger-node-1/20 text-trigger-node-1",
						isAppEntry && "bg-trigger-node-1/20 text-trigger-node-1",
						isQuery && "bg-query-node-1/20 text-query-node-1",
						"text-[12px]",
					)}
					data-content-type={contentType}
				>
					{token.value}
				</span>
			);
		}
		if (token.type === "link") {
			return (
				<Link
					key={`${token.type}-${index}-${token.value}`}
					href={token.href}
					target={token.target}
					rel={token.rel}
					className="text-link-muted hover:text-accent transition-colors font-medium no-underline hover:underline underline-offset-2"
				>
					{token.value}
				</Link>
			);
		}
		if (shouldShimmerTextTokens) {
			return (
				<span
					key={`${token.type}-${index}-${token.value}`}
					className={shimmerTextClassName}
					style={{
						animationDuration: "1s",
						animationTimingFunction: "linear",
					}}
				>
					{token.value}
				</span>
			);
		}
		return (
			<span key={`${token.type}-${index}-${token.value}`}>{token.value}</span>
		);
	});
}

export function PsuedoAgenticText({
	task,
	revealMode = "chunks",
}: {
	task: UITask;
	revealMode?: RevealMode;
}) {
	const lines = task.pseudoAgenticText.lines;
	const currentExecutionLine = task.pseudoAgenticText.currentExecutionLine;
	const renderedByKey = useMemo(() => {
		const map = new Map<string, React.ReactNode[]>();
		for (const line of lines) {
			map.set(
				line.key,
				renderTokens(line.tokens, { shouldShimmerTextTokens: false }),
			);
		}
		return map;
	}, [lines]);

	const [hasMounted, setHasMounted] = useState(false);
	useEffect(() => {
		setHasMounted(true);
	}, []);

	if (lines.length === 0 && currentExecutionLine === null) {
		return null;
	}

	return (
		<div className="text-[13px] text-text-muted/70 mt-8 space-y-3 leading-relaxed break-words">
			{lines.map((line) => {
				const rendered = renderedByKey.get(line.key);
				if (!rendered || rendered.length === 0) return null;

				return (
					<motion.p key={line.key} layout="position">
						{revealMode === "dissolve" ? (
							<motion.span
								className="whitespace-pre-wrap"
								initial={
									hasMounted
										? {
												opacity: 0,
												x: -6,
												filter: "blur(4px)",
												scale: 0.995,
											}
										: false
								}
								animate={{
									opacity: 1,
									x: 0,
									filter: "blur(0px)",
									scale: 1,
								}}
								transition={{
									duration:
										getDissolveDurationMs(
											line.tokens.map((t) => t.value).join(""),
										) / 1000,
									ease: [0.16, 1, 0.3, 1],
								}}
							>
								{rendered}
							</motion.span>
						) : (
							<span className="whitespace-pre-wrap">{rendered}</span>
						)}
					</motion.p>
				);
			})}
			{currentExecutionLine !== null ? (
				<p className="italic">
					<span className="whitespace-pre-wrap">
						{renderTokens(currentExecutionLine.tokens, {
							shouldShimmerTextTokens: true,
						})}
					</span>
				</p>
			) : null}
		</div>
	);
}
