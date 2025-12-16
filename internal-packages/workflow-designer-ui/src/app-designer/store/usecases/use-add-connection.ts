import {
	type Connection,
	ConnectionId,
	type InputId,
	type NodeLike,
	type OutputId,
} from "@giselles-ai/protocol";
import { useCallback } from "react";
import { useWorkspaceActions } from "../hooks";

export function useAddConnection() {
	const { addConnection } = useWorkspaceActions((s) => ({
		addConnection: s.addConnection,
	}));

	return useCallback(
		(args: {
			outputNode: NodeLike;
			outputId: OutputId;
			inputNode: NodeLike;
			inputId: InputId;
		}) => {
			const { outputNode, outputId, inputNode, inputId } = args;
			const newConnection = {
				id: ConnectionId.generate(),
				outputNode: {
					id: outputNode.id,
					type: outputNode.type,
					content: { type: outputNode.content.type },
				},
				outputId,
				inputNode: {
					id: inputNode.id,
					type: inputNode.type,
					content: { type: inputNode.content.type },
				},
				inputId,
			} as Connection;

			addConnection(newConnection);
			return newConnection;
		},
		[addConnection],
	);
}
