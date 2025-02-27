import {
	type ActionNode,
	isFileNode,
	isGitHubNode,
	isTextGenerationNode,
	isTextNode,
} from "@giselle-sdk/data-type";
import { useMemo } from "react";
import type { Source } from "./types";
import { filterSources } from "./utils";

function isActionNode(args: unknown): args is ActionNode {
	return isTextGenerationNode(args) || isGitHubNode(args);
}

export function useSourceCategories(sources: Source[]) {
	const generatedSources = useMemo(
		() => filterSources(sources, isActionNode),
		[sources],
	);
	const textSources = useMemo(
		() => filterSources(sources, isTextNode),
		[sources],
	);
	const fileSources = useMemo(
		() => filterSources(sources, isFileNode),
		[sources],
	);

	return {
		generatedSources,
		textSources,
		fileSources,
	};
}
