import {
	getLanguageModelTool,
	type LanguageModelToolName,
} from "@giselles-ai/language-model-registry";
import type { ContentGenerationNode } from "@giselles-ai/protocol";
import { useFeatureFlag } from "@giselles-ai/react";
import clsx from "clsx/lite";
import { CheckIcon } from "lucide-react";
import { type PropsWithChildren, type ReactNode, useMemo } from "react";
import { toolProviders } from "./tool-provider";

export function ToolsPanel({ node }: { node: ContentGenerationNode }) {
	const { privatePreviewTools } = useFeatureFlag();
	const filteredProviders = useMemo(
		() =>
			toolProviders.filter(
				(provider) => provider.toolName !== "postgres" || privatePreviewTools,
			),
		[privatePreviewTools],
	);
	return (
		<div className="text-inverse space-y-[8px]">
			{filteredProviders.map(
				(provider) =>
					(provider.requirement === undefined ||
						provider.requirement(node)) && (
						<ToolListItem
							key={provider.toolName}
							toolName={provider.toolName}
							icon={provider.icon}
							node={node}
							configurationPanel={provider.renderConfiguration(node)}
						>
							<div className="flex gap-[10px] items-center">
								<h3 className="text-text text-[14px]">{provider.label}</h3>
								{node.content.tools.some(
									(tool) => tool.name === provider.toolName,
								) && <CheckIcon className="size-[14px] text-success" />}
							</div>
						</ToolListItem>
					),
			)}
		</div>
	);
}

interface ToolListItemProps {
	icon: ReactNode;
	configurationPanel: ReactNode;
	toolName: LanguageModelToolName;
	node: ContentGenerationNode;
}
function ToolListItem({
	children,
	icon,
	configurationPanel,
	toolName,
	node,
}: PropsWithChildren<ToolListItemProps>) {
	const nodeTool = useMemo(
		() => node.content.tools.find((tool) => tool.name === toolName),
		[node.content.tools, toolName],
	);
	const languageModelTool = getLanguageModelTool(toolName);

	const availableTools = useMemo(() => {
		if (nodeTool === undefined) {
			return [];
		}
		if (
			"useTools" in nodeTool.configuration &&
			Array.isArray(nodeTool.configuration.useTools)
		) {
			return nodeTool.configuration.useTools.map((tool) => {
				const t = languageModelTool.tools?.find((t) => t.name === tool);
				return t?.title ?? t?.name ?? tool;
			});
		}
		return [];
	}, [nodeTool, languageModelTool]);

	return (
		<div
			className={clsx(
				"rounded-[8px] px-[12px] w-full py-[10px] bg-background",
				"**:data-tool-icon:size-[20px] **:data-tool-icon:text-inverse",
				"**:data-dialog-trigger-icon:size-[14px]",
			)}
		>
			<div className=" flex items-center justify-between">
				<div className="flex gap-[10px] items-center">
					{icon}
					{children}
				</div>
				{configurationPanel}
			</div>
			{availableTools.length > 0 && (
				<div className="mt-[6px]">
					<div className="flex flex-wrap text-[12px] text-text-muted gap-x-[6px] gap-y-[6px]">
						{availableTools.map((availableTool) => (
							<p
								className="rounded-full px-[6px] py-[1px] bg-[color-mix(in_srgb,var(--color-text-inverse,#fff)_10%,transparent)]"
								key={availableTool}
							>
								{availableTool}
							</p>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
