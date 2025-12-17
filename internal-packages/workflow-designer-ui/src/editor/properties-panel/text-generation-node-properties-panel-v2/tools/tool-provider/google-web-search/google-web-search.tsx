import { Button } from "@giselle-internal/ui/button";
import { Toggle } from "@giselle-internal/ui/toggle";
import type { ContentGenerationNode } from "@giselles-ai/protocol";
import { Settings2Icon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useUpdateNodeDataContent } from "../../../../../../app-designer";
import { upsertArray } from "../../../../../lib/upsert-array";
import { ToolConfigurationDialog } from "../../ui/tool-configuration-dialog";

const toolName = "google-web-search";

export function GoogleWebSearchToolConfigurationDialog({
	node,
	open: externalOpen,
	onOpenChange: externalOnOpenChange,
}: {
	node: ContentGenerationNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const updateNodeDataContent = useUpdateNodeDataContent();
	const [internalOpen, setInternalOpen] = useState(false);

	const open = externalOpen ?? internalOpen;
	const setOpen = externalOnOpenChange ?? setInternalOpen;

	const currentToolConfig = useMemo(
		() => node.content.tools.find((tool) => tool.name === toolName),
		[node.content.tools],
	);

	const [webSearchEnabled, setWebSearchEnabled] = useState(!!currentToolConfig);

	const handleWebSearchToggle = useCallback((enabled: boolean) => {
		setWebSearchEnabled(enabled);
	}, []);

	const updateGoogleWebSearchToolConfiguration = useCallback<
		React.FormEventHandler<HTMLFormElement>
	>(
		(event) => {
			event.preventDefault();

			type ToolTransition = "noop" | "upsert" | "remove";
			const transition: ToolTransition = webSearchEnabled
				? "upsert"
				: currentToolConfig
					? "remove"
					: "noop";

			if (transition === "noop") {
				setOpen(false);
				return;
			}

			switch (transition) {
				case "remove": {
					updateNodeDataContent(node, {
						...node.content,
						tools: node.content.tools.filter((tool) => tool.name !== toolName),
					});
					break;
				}
				case "upsert": {
					updateNodeDataContent(node, {
						...node.content,
						tools: upsertArray(
							node.content.tools,
							{
								name: toolName,
								configuration: {},
							},
							(tool) => tool.name === toolName,
						),
					});
					break;
				}
			}

			setOpen(false);
		},
		[node, updateNodeDataContent, currentToolConfig, webSearchEnabled, setOpen],
	);

	return (
		<ToolConfigurationDialog
			title="Web Search Configuration"
			description=""
			onSubmit={updateGoogleWebSearchToolConfiguration}
			submitting={false}
			trigger={
				<Button
					type="button"
					leftIcon={<Settings2Icon data-dialog-trigger-icon />}
					variant="link"
				>
					Configure
				</Button>
			}
			open={open}
			onOpenChange={setOpen}
		>
			<div className="flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<div className="text-[14px] py-[1.5px] whitespace-nowrap">
							Web Search
						</div>
						<div className="text-[12px] text-text-muted whitespace-nowrap">
							Enable for this model
						</div>
					</div>
					<div className="flex-1 h-px bg-border ml-4"></div>
					<Toggle
						name="web-search-enabled"
						checked={webSearchEnabled}
						onCheckedChange={handleWebSearchToggle}
					/>
				</div>

				{webSearchEnabled && (
					<p className="text-sm text-text-muted">
						Google Web Search does not require additional configuration. Disable
						to remove it from this node.
					</p>
				)}
			</div>
		</ToolConfigurationDialog>
	);
}
