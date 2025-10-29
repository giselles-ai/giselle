import { IconBox } from "@giselle-internal/ui/icon-box";
import type { TriggerNode } from "@giselle-sdk/data-type";
import { useWorkflowDesigner } from "@giselle-sdk/giselle/react";
import { Trash2 as TrashIcon } from "lucide-react";
import {
	PropertiesPanelContent,
	PropertiesPanelHeader,
	PropertiesPanelRoot,
} from "../ui";
import { GitHubTriggerPropertiesPanel } from "./providers/github-trigger/github-trigger-properties-panel";
import { ManualTriggerPropertiesPanel } from "./providers/manual-trigger/manual-trigger-properties-panel";

export function TriggerNodePropertiesPanel({ node }: { node: TriggerNode }) {
	const { updateNodeData, deleteNode } = useWorkflowDesigner();
	return (
		<PropertiesPanelRoot>
			<PropertiesPanelHeader
				node={node}
				onChangeName={(name?: string) => updateNodeData(node, { name })}
				action={
					<div className="flex items-center gap-[6px] ml-[8px]">
						<IconBox
							aria-label="Open documentation"
							title="Open documentation"
							onClick={() =>
								window.open(
									"https://docs.giselles.ai/en/glossary/trigger-node",
									"_blank",
									"noopener,noreferrer",
								)
							}
						>
							<svg
								className="size-[14px]"
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								role="img"
								aria-label="External link"
							>
								<path
									d="M14 3h7v7m0-7L10 14"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
								<path
									d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</IconBox>
						<IconBox
							aria-label="Delete node"
							title="Delete node"
							onClick={() => deleteNode(node.id)}
						>
							<TrashIcon className="size-[14px]" />
						</IconBox>
					</div>
				}
			/>
			<PropertiesPanelContent>
				<PropertiesPanel node={node} />
			</PropertiesPanelContent>
		</PropertiesPanelRoot>
	);
}
function PropertiesPanel({ node }: { node: TriggerNode }) {
	switch (node.content.provider) {
		case "github":
			return <GitHubTriggerPropertiesPanel node={node} />;
		case "manual":
			return <ManualTriggerPropertiesPanel node={node} />;
		default: {
			const _exhaustiveCheck: never = node.content.provider;
			throw new Error(`Unhandled action: ${_exhaustiveCheck}`);
		}
	}
}
