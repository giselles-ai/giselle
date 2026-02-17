import type { NodeLike } from "@giselles-ai/protocol";
import { useState } from "react";
import { useUpdateNodeDataContent } from "../../../app-designer";
import { SettingDetail } from "../ui/setting-label";
import { StructuredOutputDialog } from "./structured-output-dialog";

type NodeWithOutputSchema = NodeLike & {
	content: { outputSchema?: string };
};

export function OutputFormat({ node }: { node: NodeWithOutputSchema }) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const updateNodeDataContent = useUpdateNodeDataContent();

	return (
		<div>
			<SettingDetail className="mb-[6px]">Structured Output</SettingDetail>
			<button
				type="button"
				onClick={() => setIsDialogOpen(true)}
				className="w-full rounded-[8px] border border-white/10 bg-white/5 px-[12px] py-[8px] text-[13px] text-inverse/80 hover:text-inverse hover:bg-white/10 transition-colors text-left"
			>
				{node.content.outputSchema
					? "Edit Structured Output"
					: "Set Structured Output"}
			</button>
			{node.content.outputSchema && (
				<pre className="mt-[4px] rounded-[6px] bg-black/20 p-[8px] text-[11px] text-text/50 font-mono overflow-auto max-h-[100px]">
					{node.content.outputSchema}
				</pre>
			)}
			<StructuredOutputDialog
				isOpen={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				title="Text Generation Node — Structured Output"
				description="Define a JSON Schema for the text generation output."
				initialSchema={node.content.outputSchema}
				onSave={(value) => {
					updateNodeDataContent(node, { outputSchema: value });
				}}
				showPreview={false}
			/>
		</div>
	);
}
