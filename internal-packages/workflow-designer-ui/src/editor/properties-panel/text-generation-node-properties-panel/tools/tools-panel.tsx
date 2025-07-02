import type { TextGenerationNode, ToolSet } from "@giselle-sdk/data-type";
import clsx from "clsx/lite";
import { CheckIcon } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import { toolProviders } from "./tool-provider";

function ensureTools(key: keyof ToolSet, node: TextGenerationNode): string[] {
	const toolConfig = node.content.tools?.[key];
	if (!toolConfig) return [];

	// Check if the toolConfig has a tools property
	if ("tools" in toolConfig) {
		return toolConfig.tools;
	}

	return [];
}

export function ToolsPanel({ node }: { node: TextGenerationNode }) {
	return (
		<div className="text-white-400 space-y-[16px]">
			{toolProviders.map((provider) => (
				<ToolListItem
					key={provider.key}
					icon={provider.icon}
					configurationPanel={provider.renderConfiguration(node)}
					availableTools={ensureTools(provider.key, node)}
				>
					<div className="flex gap-[10px] items-center">
						<h3 className="text-text text-[14px]">{provider.label}</h3>
						{node.content.tools?.[provider.key] && (
							<CheckIcon className="size-[14px] text-success" />
						)}
					</div>
				</ToolListItem>
			))}
		</div>
	);
}

interface ToolListItemProps {
	icon: ReactNode;
	configurationPanel: ReactNode;
	availableTools?: string[];
}
function ToolListItem({
	children,
	icon,
	configurationPanel,
	availableTools = [],
}: PropsWithChildren<ToolListItemProps>) {
	return (
		<div
			className={clsx(
				"border border-border rounded-[8px] px-[12px] w-full py-[10px]",
				"**:data-tool-icon:size-[20px] **:data-tool-icon:text-text-muted",
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
								className="border border-border rounded-full px-[6px] py-[1px]"
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
