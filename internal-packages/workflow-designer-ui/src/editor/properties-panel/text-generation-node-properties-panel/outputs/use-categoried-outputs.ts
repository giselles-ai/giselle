import {
	isActionNode,
	isFileNode,
	isGitHubNode,
	isQueryNode,
	isTextGenerationNode,
	isTextNode,
	isTriggerNode,
} from "@giselle-sdk/data-type";
import { useMemo } from "react";
import type { OutputWithDetails } from "./types";
import { filterInputs } from "./utils";

export function useCategoriedOutputs(inputs: OutputWithDetails[]) {
	const generatedInputs = useMemo(
		() => filterInputs(inputs, isTextGenerationNode),
		[inputs],
	);
	const textInputs = useMemo(() => filterInputs(inputs, isTextNode), [inputs]);
	const fileInputs = useMemo(() => filterInputs(inputs, isFileNode), [inputs]);
	const githubInputs = useMemo(
		() => filterInputs(inputs, isGitHubNode),
		[inputs],
	);
	const triggerInputs = useMemo(
		() => filterInputs(inputs, isTriggerNode),
		[inputs],
	);
	const actionInputs = useMemo(
		() => filterInputs(inputs, isActionNode),
		[inputs],
	);
	const queryInputs = useMemo(
		() => filterInputs(inputs, isQueryNode),
		[inputs],
	);

	return {
		generatedInputs,
		textInputs,
		fileInputs,
		githubInputs,
		actionInputs,
		triggerInputs,
		queryInputs,
	};
}
