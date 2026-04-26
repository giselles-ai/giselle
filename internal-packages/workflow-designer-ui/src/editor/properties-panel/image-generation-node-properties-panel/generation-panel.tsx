import type { ImageGenerationNode } from "@giselles-ai/protocol";
import { useNodeGenerations } from "@giselles-ai/react";
import clsx from "clsx/lite";
import { Maximize2 } from "lucide-react";
import { useCallback } from "react";
import { useAppDesignerStore } from "../../../app-designer";
import { GenerateImageIcon } from "../../../icons";
import { GenerationView } from "../../../ui/generation-view";
import {
	GenerationEmptyState,
	GenerationStatusHeader,
} from "../ui";

export function GenerationPanel({
	node,
	onClickGenerateButton,
	onExpand,
	isExpanded,
}: {
	node: ImageGenerationNode;
	onClickGenerateButton?: () => void;
	onExpand?: () => void;
	isExpanded?: boolean;
}) {
	const workspaceId = useAppDesignerStore((s) => s.workspaceId);
	const { currentGeneration } = useNodeGenerations({
		nodeId: node.id,
		origin: { type: "studio", workspaceId },
	});

	const _handleGenerate = useCallback(() => {
		if (onClickGenerateButton) {
			onClickGenerateButton();
		}
	}, [onClickGenerateButton]);

	if (currentGeneration === undefined) {
		return (
			<GenerationEmptyState
				icon={<GenerateImageIcon width={24} height={24} />}
				minHeight="min-h-[250px]"
				paddingY=""
			/>
		);
	}
	return (
		<div
			className={clsx(
				"relative flex flex-col bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] rounded-[8px] py-[8px]",
				isExpanded ? "flex-1 min-h-0" : "min-h-[250px]",
			)}
		>
			{onExpand && (
				<button
					type="button"
					onClick={onExpand}
					className="absolute bottom-[8px] right-[8px] size-[32px] rounded-full bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_20%,transparent)] flex items-center justify-center transition-colors group z-10"
					aria-label="Expand"
				>
					<Maximize2 className="size-[16px] text-inverse group-hover:text-inverse/80" />
				</button>
			)}
			<GenerationStatusHeader generation={currentGeneration} />
			<div className="flex-1 py-[4px] px-[16px] overflow-y-auto">
				<GenerationView generation={currentGeneration} />
			</div>
		</div>
	);
}
