import type { TextGenerationNode } from "@giselle-sdk/data-type";
import { ChevronRightIcon, DatabaseIcon } from "lucide-react";
import { type SVGProps, useMemo } from "react";
import { GitHubIcon } from "../../../tool";

type UIToolName = "GitHub" | "PostgreSQL";
interface UITool {
	name: UIToolName;
	commands: string[];
}

function ToolIcon({
	name,
	...props
}: { name: UIToolName } & SVGProps<SVGSVGElement>) {
	switch (name) {
		case "GitHub":
			return <GitHubIcon {...props} />;
		case "PostgreSQL":
			return <DatabaseIcon {...props} />;
		default: {
			const _exhaustiveCheck: never = name;
			throw new Error(`Unhandled tool name: ${_exhaustiveCheck}`);
		}
	}
}

function ToolCard({
	tool,
	description,
}: {
	tool: UITool;
	description: string;
}) {
	return (
		<div className="border border-black-400 rounded-[8px] p-[6px] flex items-center justify-between hover:bg-black-800/50 transition-all duration-200 cursor-pointer h-[52px]">
			<div className="flex gap-[8px]">
				<div className="rounded-[6px] size-[38px] flex items-center justify-center bg-white-400/40">
					<ToolIcon name={tool.name} className="size-[24px] text-white" />
				</div>
				<div>
					<div className="flex items-center gap-2">
						<h3 className="text-[15px]">{tool.name}</h3>
					</div>
					<p className="text-black-300 text-[11px]">{description}</p>
				</div>
			</div>
			<ChevronRightIcon className="w-5 h-5 text-gray-400" />
		</div>
	);
}

function ToolsSection({
	title,
	tools,
	getDescription,
	spacingClass,
}: {
	title: string;
	tools: UITool[];
	getDescription: (tool: UITool) => string;
	spacingClass: string;
}) {
	if (tools.length === 0) return null;
	return (
		<div className="space-y-[8px]">
			<h2 className="text-[15px] font-accent">{title}</h2>
			<div className={spacingClass}>
				{tools.map((tool) => (
					<ToolCard
						key={tool.name}
						tool={tool}
						description={getDescription(tool)}
					/>
				))}
			</div>
		</div>
	);
}

export function ToolsPanel({
	node,
}: {
	node: TextGenerationNode;
}) {
	const { enableTools, availableTools } = useMemo(() => {
		const enableTools: UITool[] = [];
		const availableTools: UITool[] = [];
		if (node.content.tools?.github === undefined) {
			availableTools.push({
				name: "GitHub",
				commands: [],
			});
		} else {
			enableTools.push({
				name: "GitHub",
				commands: node.content.tools.github.tools,
			});
		}
		if (node.content.tools?.postgres === undefined) {
			availableTools.push({
				name: "PostgreSQL",
				commands: [],
			});
		} else {
			enableTools.push({
				name: "PostgreSQL",
				commands: node.content.tools.postgres.tools,
			});
		}
		return {
			enableTools,
			availableTools,
		};
	}, [node.content.tools]);

	return (
		<div className="text-white-400 space-y-[16px]">
			<ToolsSection
				title="Enabled Tools"
				tools={enableTools}
				spacingClass="space-y-[6px]"
				getDescription={(tool) => `${tool.commands.length} tools enabled`}
			/>
			<ToolsSection
				title="Available Tools"
				tools={availableTools}
				spacingClass="space-y-[8px]"
				getDescription={(tool) => `Add ${tool.name} tool`}
			/>
		</div>
	);
}
