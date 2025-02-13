import type { NodeData } from "@/lib/workflow-data";
import { useNode } from "../workflow-designer-context";

export function Node({ data }: { data: NodeData }) {
	const {
		updateData,
		addConnection,
		handleGeneratingTextSubmit,
		generatedText,
		prompt,
		handlePromptChange,
	} = useNode(data.id);
	if (data.type === "action" && data.content.type === "textGeneration") {
		return (
			<form onSubmit={handleGeneratingTextSubmit}>
				<p>Hello,{data.name}!!</p>
				<p>{data.content.prompt}</p>
				<p>{generatedText}</p>
				<button
					type="button"
					onClick={() => {
						const handle = addConnection({
							label: "new source",
							sourceNode: data,
						});
						updateData({
							content: {
								...data.content,
								sources: [...data.content.sources, handle],
							},
						});
					}}
				>
					add source
				</button>

				<button type="submit">submit</button>
				<textarea value={prompt} onChange={handlePromptChange} />
			</form>
		);
	}
	return (
		<div>
			<p>Hello,{data.name}</p>
			<button type="button">add source</button>
		</div>
	);
}
