import {
	isFileNode,
	isGitHubNode,
	isTextGenerationNode,
	isTextNode,
} from "@giselle-sdk/data-type";
import { useMemo } from "react";
import type { Source } from "./types";
import { filterSources } from "./utils";

export function useSourceCategories(sources: Source[]) {
	const generatedSources = useMemo(
		() => filterSources(sources, isTextGenerationNode),
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
	const githubSources = useMemo(
		() => filterSources(sources, isGitHubNode),
		[sources],
	);

	return {
		generatedSources,
		textSources,
		fileSources,
		githubSources,
	};
}
