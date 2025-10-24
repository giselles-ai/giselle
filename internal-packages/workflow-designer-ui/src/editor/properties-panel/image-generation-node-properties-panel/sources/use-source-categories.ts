import {
	isFileNode,
	isGitHubNode,
	isQueryNode,
	isTextGenerationNode,
	isTextNode,
} from "@giselle-sdk/data-type";
import { useMemo } from "react";
import type { Source } from "./types";
import { filterSources } from "./utils";

export function useSourceCategories(_sources: Source[]) {
	const generatedSources = useMemo(
		() => filterSources(_sources, isTextGenerationNode),
		[_sources],
	);
	const textSources = useMemo(
		() => filterSources(_sources, isTextNode),
		[_sources],
	);
	const fileSources = useMemo(
		() => filterSources(_sources, isFileNode),
		[_sources],
	);
	const githubSources = useMemo(
		() => filterSources(_sources, isGitHubNode),
		[_sources],
	);
	const querySources = useMemo(
		() => filterSources(_sources, isQueryNode),
		[_sources],
	);

	return {
		generatedSources,
		textSources,
		fileSources,
		githubSources,
		querySources,
	};
}
