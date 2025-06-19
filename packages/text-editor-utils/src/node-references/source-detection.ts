import type { NodeId, OutputId } from "@giselle-sdk/data-type";
import type { JSONContent } from "@tiptap/core";

export interface SourceReference {
	nodeId: NodeId;
	outputId: OutputId;
}

/**
 * Extract all Source references from TipTap JSONContent
 */
function extractSourceReferences(content: JSONContent): SourceReference[] {
	const sources: SourceReference[] = [];

	function traverse(node: JSONContent) {
		if (node.type === "Source") {
			// Extract valid sources with complete attrs
			if (node.attrs?.node?.id && node.attrs?.outputId) {
				sources.push({
					nodeId: node.attrs.node.id,
					outputId: node.attrs.outputId,
				});
			}
			// Log any Source nodes with incomplete attrs for debugging
			else {
				console.log("Found Source node with incomplete attrs:", node);
			}
		}

		if (node.content) {
			for (const child of node.content) {
				traverse(child);
			}
		}
	}

	traverse(content);
	return sources;
}

/**
 * Find Source references that were removed between two JSON states
 */
export function findRemovedSources(
	oldContent: JSONContent,
	newContent: JSONContent,
): SourceReference[] {
	const oldSources = extractSourceReferences(oldContent);
	const newSources = extractSourceReferences(newContent);

	const newSourcesSet = new Set(
		newSources.map((s) => `${s.nodeId}:${s.outputId}`),
	);

	return oldSources.filter(
		(source) => !newSourcesSet.has(`${source.nodeId}:${source.outputId}`),
	);
}
