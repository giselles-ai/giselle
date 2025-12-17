import {
	isActionNode,
	isAppEntryNode,
	isImageGenerationNode,
	isTextGenerationNode,
	isTriggerNode,
	isVectorStoreNode,
	type NodeId,
	type NodeLike,
} from "@giselles-ai/protocol";
import { useEffect, useRef, useTransition } from "react";
import { useCurrentNodeGeneration } from "./use-current-node-generation";

export function getCompletionLabel(node: NodeLike): string {
	if (isTextGenerationNode(node) || isImageGenerationNode(node)) {
		return node.content.llm.provider;
	}
	return "Completed";
}

export function nodeRequiresSetup(node: NodeLike): boolean {
	if (isAppEntryNode(node)) {
		return node.content.status !== "configured";
	}
	if (isTriggerNode(node, "github")) {
		return node.content.state.status !== "configured";
	}
	if (isActionNode(node, "github")) {
		return node.content.command.state.status !== "configured";
	}
	if (isVectorStoreNode(node)) {
		switch (node.content.source.provider) {
			case "github":
			case "document":
				return node.content.source.state.status !== "configured";
			default:
				return false;
		}
	}
	return false;
}

export function useNodeGenerationStatus(nodeId: NodeId) {
	const { currentGeneration, stopCurrentGeneration } =
		useCurrentNodeGeneration(nodeId);
	const prevGenerationStatusRef = useRef(currentGeneration?.status);
	const [showCompleteLabel, startTransition] = useTransition();

	useEffect(() => {
		if (currentGeneration === undefined) {
			return;
		}
		if (
			prevGenerationStatusRef.current === "running" &&
			currentGeneration.status === "completed"
		) {
			startTransition(
				async () =>
					new Promise((resolve) => {
						setTimeout(() => {
							resolve();
						}, 2000);
					}),
			);
		}
		prevGenerationStatusRef.current = currentGeneration.status;
	}, [currentGeneration]);

	return { currentGeneration, stopCurrentGeneration, showCompleteLabel };
}
