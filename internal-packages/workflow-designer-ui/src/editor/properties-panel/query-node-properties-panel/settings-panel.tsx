import {
	DEFAULT_MAX_RESULTS,
	DEFAULT_SIMILARITY_THRESHOLD,
	type QueryNode,
} from "@giselles-ai/protocol";
import { useUpdateNodeDataContent } from "../../../app-designer";
import { Slider } from "../../../ui/slider";

export function SettingsPanel({ node }: { node: QueryNode }) {
	const updateNodeDataContent = useUpdateNodeDataContent();

	return (
		<div className="grid grid-cols-1 gap-[8px]">
			<Slider
				label="Max Results"
				labelClassName="text-[14px]"
				value={node.content.maxResults ?? DEFAULT_MAX_RESULTS}
				max={100}
				min={1}
				step={1}
				formatValue={(value) => Math.round(value).toString()}
				onChange={(value) => {
					updateNodeDataContent(node, {
						maxResults: Math.round(value),
					});
				}}
			/>
			<Slider
				label="Similarity Threshold"
				labelClassName="text-[14px]"
				value={node.content.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD}
				max={1}
				min={0}
				step={0.01}
				onChange={(value) => {
					updateNodeDataContent(node, {
						similarityThreshold: value,
					});
				}}
			/>
		</div>
	);
}
