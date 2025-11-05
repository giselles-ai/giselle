import type { TextGenerationNode, ToolSet } from "@giselles-ai/protocol";
import clsx from "clsx/lite";
import { CheckIcon } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import { toolProviders } from "./tool-provider";

function ensureTools(key: keyof ToolSet, node: TextGenerationNode): string[] {
	return (
		(node.content.tools?.[key] && "tools" in node.content.tools[key]
			? (node.content.tools[key] as { tools?: string[] }).tools
			: undefined) ?? []
	);
}

export function ToolsPanel({ node }: { node: TextGenerationNode }) {
	return (
		<div className="text-inverse space-y-[8px]">
			{toolProviders.map(
				(provider) =>
					(provider.requirement === undefined ||
						provider.requirement(node)) && (
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
					),
			)}
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
								className="rounded-full px-[6px] py-[1px] bg-inverse/10"
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
