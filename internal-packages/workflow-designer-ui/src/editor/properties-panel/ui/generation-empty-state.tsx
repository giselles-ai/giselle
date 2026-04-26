import type { ReactNode } from "react";
import { EmptyState } from "../../../ui/empty-state";

interface GenerationEmptyStateProps {
	icon: ReactNode;
	title?: string;
	description?: string;
	minHeight?: string;
	paddingY?: string;
}

export function GenerationEmptyState({
	icon,
	title = "Nothing generated yet.",
	description = "Generate or adjust the Prompt to see results.",
	minHeight,
	paddingY = "py-[24px]",
}: GenerationEmptyStateProps) {
	return (
		<div
			className={[
				"relative bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] rounded-[8px] flex justify-center items-center text-text-muted",
				minHeight ?? "",
				paddingY,
			].join(" ")}
		>
			<EmptyState
				icon={icon}
				title={title}
				description={description}
				className="text-text-muted"
			/>
		</div>
	);
}
