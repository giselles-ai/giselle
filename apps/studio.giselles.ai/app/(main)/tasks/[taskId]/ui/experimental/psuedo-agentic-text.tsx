"use client";

import clsx from "clsx/lite";
import type { PseudoAgenticTextToken, UITask } from "./task-data";

function StepItemName({ children }: { children: string }) {
	return (
		<span
			className={clsx(
				"step-item-name",
				"font-medium text-text-muted/80",
				"rounded-md bg-white/5 px-1.5 py-0.5",
			)}
		>
			{children}
		</span>
	);
}

function renderTokens(tokens: PseudoAgenticTextToken[]) {
	return tokens.map((token, index) => {
		if (token.type === "stepItemName") {
			return (
				<StepItemName key={`t-${index}-${token.value}`}>
					{token.value}
				</StepItemName>
			);
		}
		return <span key={`t-${index}-${token.value}`}>{token.value}</span>;
	});
}

export function PsuedoAgenticText({ task }: { task: UITask }) {
	const lines = task.pseudoAgenticText.lines;
	if (lines.length === 0) {
		return null;
	}
	return (
		<div className="text-[13px] text-text-muted/70 mt-8 space-y-3 leading-relaxed">
			{lines.map((line) => (
				<p key={line.key}>{renderTokens(line.tokens)}</p>
			))}
		</div>
	);
}
