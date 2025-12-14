"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { PseudoAgenticTextToken, UITask } from "./task-data";

type RevealMode = "chunks" | "dissolve";

function getDissolveDurationMs(text: string) {
	// Keep it snappy, but not “too fast to perceive”.
	// Scale lightly with length to avoid long lines feeling abrupt.
	const length = text.length;
	return Math.min(650, Math.max(260, Math.round((length / 90) * 420)));
}

function renderTokens(tokens: PseudoAgenticTextToken[]) {
	return tokens.map((token, index) => {
		if (token.type === "stepItemName") {
			return (
				<span
					key={`${token.type}-${index}-${token.value}`}
					className="step-item-name"
					data-content-type={token.contentType}
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
	const renderedByKey = useMemo(() => {
		const map = new Map<string, React.ReactNode[]>();
		for (const line of lines) {
			map.set(line.key, renderTokens(line.tokens));
		}
		return map;
	}, [lines]);

	const [hasMounted, setHasMounted] = useState(false);
	useEffect(() => {
		setHasMounted(true);
	}, []);

	if (lines.length === 0) {
		return null;
	}

	return (
		<div className="text-[13px] text-text-muted/70 mt-8 space-y-3 leading-relaxed">
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
												clipPath: "inset(0 100% 0 0)",
											}
										: false
								}
								animate={{
									opacity: 1,
									x: 0,
									filter: "blur(0px)",
									clipPath: "inset(0 0% 0 0)",
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
		</div>
	);
}
