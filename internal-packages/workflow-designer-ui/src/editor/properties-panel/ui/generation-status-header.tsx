import clsx from "clsx/lite";
import type { Generation } from "@giselles-ai/protocol";

interface GenerationStatusLabelsProps {
	generation: Generation;
	children?: React.ReactNode;
}

export function GenerationStatusHeader({
	generation,
	children,
}: GenerationStatusLabelsProps) {
	return (
		<div
			className={clsx(
				"border-b border-white-400/20 py-[4px] px-[16px] flex items-center gap-[8px]",
				"**:data-header-text:font-[700]",
			)}
		>
			{(generation.status === "created" ||
				generation.status === "queued" ||
				generation.status === "running") && (
				<p data-header-text>Generating...</p>
			)}
			{generation.status === "completed" && (
				<p data-header-text>Result</p>
			)}
			{generation.status === "failed" && <p data-header-text>Error</p>}
			{generation.status === "cancelled" && (
				<p data-header-text>Result</p>
			)}
			{children}
		</div>
	);
}
