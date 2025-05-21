import {
	isActionNode,
	isFileNode,
	isTextGenerationNode,
	isTextNode,
	isTriggerNode,
	isVectorStoreNode,
} from "@giselle-sdk/data-type";
import { useMemo } from "react";
import type { Source } from "./types";
import { filterSources } from "./utils";

export function useSourceCategories(sources: Source[]) {
	// does not support image generation
	const generatedSources = useMemo(
		() => filterSources(sources, isTextGenerationNode),
		[sources],
	);
	const actionSources = useMemo(
		() => filterSources(sources, isActionNode),
		[sources],
	);
	const triggerSources = useMemo(
		() => filterSources(sources, isTriggerNode),
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
	const datastoreSources = useMemo(
		() => filterSources(sources, isVectorStoreNode),
		[sources],
	);

	return {
		actionSources,
		triggerSources,
		generatedSources,
		textSources,
		fileSources,
		datastoreSources,
	};
}
