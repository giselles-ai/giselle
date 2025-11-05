"use client";

import type {
	NodeId,
	NodeLike,
	Workspace,
	WorkspaceId,
} from "@giselle-ai/protocol";
import { createStore } from "zustand";
import { combine } from "zustand/middleware";

export interface EditorState extends Omit<Workspace, "id"> {
	workspaceId: WorkspaceId;
}

export interface EditorAction {
	updateNode: (id: NodeId, patch: Partial<NodeLike>) => void;
	setInspectedNodeId: (id: NodeId | undefined) => void;
	setNodePosition: (id: NodeId, position: { x: number; y: number }) => void;
	setNodeSelected: (id: NodeId, selected: boolean) => void;
	removeNode: (id: NodeId) => void;
}

export type EditorStore = ReturnType<typeof createEditorStore>;

export function createEditorStore(initial: { workspace: Workspace }) {
	return createStore(
		combine<EditorState, EditorAction>(
			{
				workspaceId: initial.workspace.id,
				...initial.workspace,
			},
			(set) => ({
				updateNode: (id, patch) =>
					set((s) => ({
						nodes: s.nodes.map((node) =>
							node.id === id ? ({ ...node, ...patch } as NodeLike) : node,
						),
					})),
				setInspectedNodeId: (id) =>
					set((s) => ({
						ui: {
							...s.ui,
							inspectedNodeId: id,
						},
					})),
				setNodePosition: (id, position) =>
					set((s) => {
						const node = s.ui.nodeState[id];
						if (!node) return s;
						return {
							ui: {
								...s.ui,
								nodeState: {
									...s.ui.nodeState,
									[id]: { ...node, position },
								},
							},
						};
					}),
				setNodeSelected: (id, selected) =>
					set((s) => {
						const node = s.ui.nodeState[id];
						if (!node) return s;
						return {
							ui: {
								...s.ui,
								nodeState: {
									...s.ui.nodeState,
									[id]: { ...node, selected },
								},
							},
						};
					}),
				removeNode: (id) =>
					set((s) => {
						const nextState = { ...s.ui.nodeState };
						delete nextState[id];
						const nextNodes = s.nodes.filter((n) => n.id !== id);
						return {
							nodes: nextNodes,
							ui: {
								...s.ui,
								nodeState: nextState,
								inspectedNodeId:
									s.ui.inspectedNodeId === id
										? undefined
										: s.ui.inspectedNodeId,
							},
						};
					}),
			}),
		),
	);
}
